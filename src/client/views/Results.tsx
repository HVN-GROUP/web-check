import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useParams } from 'react-router';
import styled from '@emotion/styled';
import { ToastContainer } from 'react-toastify';

import colors from 'client/styles/colors';
import Modal from 'client/components/Form/Modal';
import Footer from 'client/components/misc/Footer';
import Loader from 'client/components/misc/Loader';
import ErrorBoundary from 'client/components/misc/ErrorBoundary';
import DocContent from 'client/components/misc/DocContent';
import { type LoadingJob, type LoadingState } from 'client/components/misc/ProgressBar';
import ActionButtons from 'client/components/misc/ActionButtons';
import AdditionalResources from 'client/components/misc/AdditionalResources';
import NoResults from 'client/components/misc/NoResults';
import ResultsMasonryGrid from 'client/components/misc/ResultsMasonryGrid';
import ViewRaw from 'client/components/misc/ViewRaw';

// Lớp giao diện HVN — thay thế AdvisoryPanel của upstream bằng bảng cảnh báo
// có gắn dịch vụ. Toàn bộ nằm trong client/hvn/, không sửa file upstream.
import ResultsTopBar from 'client/hvn/components/ResultsTopBar';
import ScoreBoard from 'client/hvn/components/ScoreBoard';
import AdvisoryTable from 'client/hvn/components/AdvisoryTable';
import ResultsFilters, { type FilterValue } from 'client/hvn/components/ResultsFilters';
import { CardMetaProvider } from 'client/hvn/cardMeta';
import { groupOfCard } from 'client/hvn/groups';
import { hvnLabel, UI } from 'client/hvn/labels';
import { buildToneLookup } from 'client/hvn/severity';

import { determineAddressType, type AddressType } from 'client/utils/address-type-checker';
import { hasData } from 'client/utils/result-processor';
import keys from 'client/utils/get-keys';
import useJobs from 'client/hooks/useJobs';
import { jobs, allCards, allCardIds } from 'client/jobs/registry';
import { runAnalysis } from 'client/analysis/registry';

const ResultsOuter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResultsContent = styled.section`
  width: 95vw;
  margin: 0 auto;
  @keyframes cardFlash {
    0%,
    30% {
      outline: 2px solid ${colors.primary};
      outline-offset: 4px;
    }
    100% {
      outline: 2px solid transparent;
      outline-offset: 4px;
    }
  }
  .flash > section {
    animation: cardFlash 1.2s ease-out;
    border-radius: 8px;
  }
`;

const NoFilterMatch = styled.p`
  margin: 0 0 1rem;
  padding: 28px;
  background: var(--hvn-white);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  font-size: 14.5px;
  color: var(--hvn-gray-600);
  text-align: center;
`;

const makeSiteName = (address: string): string => {
  try {
    const withScheme = /^https?:\/\//i.test(address) ? address : `https://${address}`;
    return new URL(withScheme).hostname.replace(/^www\./, '');
  } catch {
    return address;
  }
};

const makeActionButtons = (title: string, refresh: () => void, showInfo: () => void): ReactNode => (
  <ActionButtons
    actions={[
      { label: `Info about ${title}`, onClick: showInfo, icon: 'ⓘ' },
      { label: `Re-fetch ${title} data`, onClick: refresh, icon: '↻' },
    ]}
  />
);

const Results = (props: { address?: string }): JSX.Element => {
  const { urlToScan } = useParams();
  const address = props.address || urlToScan || '';
  const addressType: AddressType = useMemo(() => determineAddressType(address), [address]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);

  const { state: jobsState, retry, ipLookupError } = useJobs(address, addressType, jobs);

  // Shape useJobs state for the existing ProgressBar contract
  const loadingJobs: LoadingJob[] = useMemo(
    () =>
      allCardIds.map((id) => {
        const e = jobsState[id] || { state: 'loading' as LoadingState };
        return {
          name: id,
          state: e.state,
          error: e.error,
          timeTaken: e.timeTaken,
          retry: () => retry(id),
        };
      }),
    [jobsState, retry],
  );

  // Expose successful job results on window.webCheck for debugging,
  // resetting on new input so prior scans cannot accumulate
  useEffect(() => {
    (window as any).webCheck = {};
  }, [address]);
  useEffect(() => {
    const w = (window as any).webCheck;
    if (!w) return;
    Object.entries(jobsState).forEach(([id, entry]) => {
      if (entry?.state === 'success' && entry.raw !== undefined) {
        w[id] = entry.raw;
      }
    });
  }, [jobsState]);

  const showInfo = (id: string) => {
    setModalContent(DocContent(id));
    setModalOpen(true);
  };

  // Resolve each card's data, applying picker and falling back when needed
  const renderable = allCards.map(({ jobId, card }) => {
    const entry = jobsState[card.id];
    const raw = entry?.raw;
    let data = raw && card.pick ? card.pick(raw) : raw;
    if (!hasData(data) && card.fallback) data = card.fallback(jobsState);
    return { jobId, card, data, entry };
  });

  const withData = renderable.filter(({ data, entry }) => hasData(data) && !entry?.error);

  const findings = useMemo(() => runAnalysis(jobsState), [jobsState]);
  const toneOf = useMemo(() => buildToneLookup(findings), [findings]);

  // Lọc theo nhóm chủ đề + tìm kiếm, theo dải nút của bản thiết kế
  const [filter, setFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState('');
  const cardsToShow = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withData.filter(({ card }) => {
      const group = groupOfCard(card.id);
      if (filter !== 'all' && group?.id !== filter) return false;
      if (!q) return true;
      // Tìm trong cả tiêu đề tiếng Việt và tiêu đề gốc, để gõ "ssl" hay
      // "chứng thư" đều ra.
      return (
        hvnLabel(card.id, card.title).toLowerCase().includes(q) ||
        card.title.toLowerCase().includes(q) ||
        card.id.includes(q)
      );
    });
  }, [withData, filter, query]);

  // Dữ liệu cho thanh trên cùng của bản thiết kế HVN
  const scannedAt = useMemo(() => new Date(), [address]);
  const doneCount = loadingJobs.filter((j) => j.state !== 'loading').length;
  const elapsedMs = loadingJobs.reduce((max, j) => Math.max(max, j.timeTaken || 0), 0);
  const siteIsSecure = jobsState['ssl']?.state === 'success';
  const targetHref = /^https?:\/\//i.test(address) ? address : `https://${address}`;
  const rescanAll = () => allCardIds.forEach((id) => retry(id));

  // Detect a catastrophic API outage when the bulk of settled jobs error or time out
  const apiUnreachable = useMemo(() => {
    const entries = Object.values(jobsState);
    const settled = entries.filter((e) => e?.state !== 'loading');
    const dead = settled.filter((e) => e?.state === 'error' || e?.state === 'timed-out');
    return settled.length >= entries.length / 2 && dead.length / settled.length >= 0.9;
  }, [jobsState]);

  // Every check settled as skipped, e.g. when the admin has blocked the target host
  const allSkipped = useMemo(() => {
    const entries = Object.values(jobsState);
    return entries.length > 0 && entries.every((e) => e?.state === 'skipped');
  }, [jobsState]);
  const skipReason = allSkipped ? Object.values(jobsState).find((e) => e?.error)?.error : undefined;

  // Pick the highest-priority error state, if any
  let errorKind: 'invalid' | 'unreachable' | 'api-down' | 'disabled' | 'blocked' | null = null;
  if (keys.disableEverything) {
    errorKind = 'disabled';
  } else if (addressType === 'err') {
    errorKind = 'invalid';
  } else if (ipLookupError) {
    errorKind = 'unreachable';
  } else if (allSkipped) {
    errorKind = 'blocked';
  } else if (apiUnreachable) {
    errorKind = 'api-down';
  }

  const jumpToCard = (id: string) => {
    const el = document.getElementById(`card-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
    window.setTimeout(() => el.classList.remove('flash'), 1300);
  };

  return (
    <ResultsOuter>
      {address && (
        <ResultsTopBar
          siteName={makeSiteName(address)}
          href={targetHref}
          secure={siteIsSecure}
          doneCount={doneCount}
          totalCount={allCardIds.length}
          elapsedMs={elapsedMs}
          scannedAt={scannedAt}
          onRescan={rescanAll}
        />
      )}
      {errorKind && (
        <NoResults kind={errorKind} address={address} error={ipLookupError || skipReason} />
      )}
      <Loader show={doneCount < 5} />
      {!errorKind && <ScoreBoard findings={findings} />}
      {!errorKind && <AdvisoryTable findings={findings} onJumpTo={jumpToCard} />}
      {!errorKind && (
        <ResultsFilters
          filter={filter}
          onFilter={setFilter}
          query={query}
          onQuery={setQuery}
          shown={cardsToShow.length}
          total={withData.length}
        />
      )}
      <ResultsContent>
        {!errorKind && withData.length > 0 && cardsToShow.length === 0 && (
          <NoFilterMatch>{UI.noFilterMatch}</NoFilterMatch>
        )}
        <ResultsMasonryGrid minColWidth={336}>
          {cardsToShow.map(({ card, data }) => {
            const label = hvnLabel(card.id, card.title);
            return (
              <div id={`card-${card.id}`} key={`eb-${card.id}`}>
                <ErrorBoundary title={label}>
                  <CardMetaProvider
                    value={{
                      cardId: card.id,
                      groupName: groupOfCard(card.id)?.name,
                      dotTone: toneOf(card.id),
                    }}
                  >
                    <card.Component
                      key={card.id}
                      data={data}
                      title={label}
                      actionButtons={makeActionButtons(
                        label,
                        () => retry(card.id),
                        () => showInfo(card.id),
                      )}
                    />
                  </CardMetaProvider>
                </ErrorBoundary>
              </div>
            );
          })}
        </ResultsMasonryGrid>
      </ResultsContent>
      {!errorKind && (
        <ViewRaw
          everything={renderable.map((r) => ({
            id: r.card.id,
            title: r.card.title,
            result: r.data,
          }))}
        />
      )}
      <AdditionalResources url={address} />

      <Modal isOpen={modalOpen} closeModal={() => setModalOpen(false)}>
        {modalContent}
      </Modal>
      <ToastContainer
        limit={3}
        draggablePercent={60}
        autoClose={2500}
        theme="light"
        position="bottom-right"
      />
      <Footer />
    </ResultsOuter>
  );
};

export default Results;
