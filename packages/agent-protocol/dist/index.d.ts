export type AgentTaskStatus = 'queued' | 'running' | 'waiting_for_time' | 'waiting_for_tab' | 'waiting_for_page_state' | 'needs_approval' | 'completed' | 'failed' | 'stopped';
export type AgentTaskScheduleKind = 'once' | 'interval';
export type AgentOrchestrationOwner = 'local' | 'temporal';
export interface AgentTaskSchedule {
    kind: AgentTaskScheduleKind;
    intervalMs?: number;
}
export type AgentEconomicsScope = 'human' | 'site' | 'central';
export type AgentExecutionChannel = 'dom' | 'adapter' | 'page_api' | 'remote_api' | 'mcp';
export interface AgentCapabilityActionRecord {
    action: string;
    channels: AgentExecutionChannel[];
    preferredChannel?: AgentExecutionChannel;
    verifiedAt?: number;
}
export interface AgentSiteCapabilityRecord {
    origin: string;
    integrationKind?: string;
    runtimeConfirmed?: boolean;
    channels: AgentExecutionChannel[];
    actions: AgentCapabilityActionRecord[];
    selectedAction?: string;
    selectedChannel?: AgentExecutionChannel;
    lastUpdatedAt: number;
    metadata?: Record<string, unknown>;
}
export interface AgentTaskStopConditions {
    maxRuns?: number;
    stopAt?: number;
    scope?: AgentEconomicsScope;
    budgetLamports?: number;
    minBalanceLamports?: number;
    targetBalanceLamports?: number;
    targetMultiplier?: number;
    takeProfitUsd?: number;
    maxLossUsd?: number;
    maxDrawdownUsd?: number;
    targetValueUsd?: number;
}
export interface AgentTaskRecord {
    id: string;
    origin: string;
    status: AgentTaskStatus;
    goal: string;
    orchestrationOwner?: AgentOrchestrationOwner;
    schedule: AgentTaskSchedule;
    stopConditions?: AgentTaskStopConditions;
    attemptCount: number;
    runCount: number;
    lastError?: string;
    lastSuccessAt?: number;
    lastRunStartedAt?: number;
    lastRunCompletedAt?: number;
    lastHeartbeatAt?: number;
    nextRunAt?: number;
    waitingReason?: string;
    requiredOrigin?: string;
    requiredTabPresent?: boolean;
    lastSnapshotAt?: number;
    plannerState?: Record<string, unknown>;
    completedAt?: number;
    stoppedAt?: number;
    createdAt: number;
    updatedAt: number;
}
export interface AgentTaskUpdatedEvent {
    type: 'AGENT_TASK_UPDATED';
    task: AgentTaskRecord;
    previousStatus?: AgentTaskStatus | null;
}
export interface AgentEnqueueTaskRequest {
    type: 'AGENT_ENQUEUE_TASK';
    origin: string;
    goal: string;
    nextRunAt?: number;
    plannerState?: Record<string, unknown>;
}
export interface AgentGetTasksRequest {
    type: 'AGENT_GET_TASKS';
    origin?: string;
    status?: AgentTaskStatus;
}
export interface AgentGetHealthRequest {
    type: 'AGENT_GET_HEALTH';
    staleAfterMs?: number;
}
export interface AgentRunTaskTickRequest {
    type: 'AGENT_RUN_TASK_TICK';
    taskId?: string;
    origin?: string;
}
export interface AgentEnqueueTaskResponse {
    task: AgentTaskRecord;
}
export interface AgentGetTasksResponse {
    tasks: AgentTaskRecord[];
}
export interface AgentHealthRecord {
    origin: string;
    status: AgentTaskStatus;
    stale: boolean;
    lastHeartbeatAt?: number;
    lastSuccessAt?: number;
    nextRunAt?: number;
    waitingReason?: string;
}
export interface AgentGetHealthResponse {
    generatedAt: number;
    staleAfterMs: number;
    healthyCount: number;
    staleCount: number;
    waitingCount: number;
    tasks: AgentHealthRecord[];
}
export interface AgentTaskTickResult {
    task: AgentTaskRecord | null;
    action?: string;
    detail: string;
    success: boolean;
}
export type AgentStrategyStatus = AgentTaskStatus | 'paused';
export interface AgentStrategyRecord {
    id: string;
    origin: string;
    goal: string;
    status: AgentStrategyStatus;
    schedule: AgentTaskSchedule;
    stopConditions?: AgentTaskStopConditions;
    nextRunAt?: number;
    runCount: number;
    createdAt: number;
    updatedAt: number;
    lastRunStartedAt?: number;
    lastRunCompletedAt?: number;
    lastError?: string;
    metadata?: Record<string, unknown>;
}
export interface AgentStrategyProgressRecord {
    strategyId: string;
    origin: string;
    goal: string;
    status: AgentStrategyStatus;
    updatedAt: number;
    requiredOrigin?: string;
    checkpointPhase?: string;
    executionChannel?: AgentExecutionChannel;
    capability?: AgentSiteCapabilityRecord;
    workflow?: {
        recoveryCount?: number;
        resumeCount?: number;
        reopenAttempts?: number;
        lastRecoveredAt?: number;
        lastReopenedAt?: number;
        needsTabRecovery?: boolean;
        lastResumeReason?: string;
    };
    economics?: {
        scope?: AgentEconomicsScope;
        baselineLamports?: number;
        currentLamports?: number;
        peakLamports?: number;
        profitLamports?: number;
        spentLamports?: number;
        multiplier?: number;
        baselineUsd?: number;
        currentUsd?: number;
        peakUsd?: number;
        pnlUsd?: number;
        drawdownUsd?: number;
        lastEvaluatedAt?: number;
    };
}
export interface AgentControlSkillRecord {
    scope: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    metadata?: Record<string, unknown>;
}
export type AgentDocumentationTrustSource = 'user_provided' | 'same_origin_official' | 'official_allowlist' | 'research_discovered_unverified';
export type AgentDocumentationTrustLevel = 'high' | 'medium' | 'low';
export type AgentDocumentationSourceType = 'search_result' | 'fetched_document' | 'cached_document';
export interface AgentDocumentationRecord {
    cacheKey: string;
    origin: string;
    workflow?: string;
    query?: string;
    url: string;
    title: string;
    excerpt: string;
    normalizedText?: string;
    contentType?: string;
    sourceType: AgentDocumentationSourceType;
    trustSource: AgentDocumentationTrustSource;
    trustLevel: AgentDocumentationTrustLevel;
    matchedOrigin: boolean;
    domain: string;
    reason?: string;
    fetchedAt: number;
    expiresAt?: number;
    metadata?: Record<string, unknown>;
    error?: string;
}
export interface AgentDocumentationSearchRequest {
    origin: string;
    query: string;
    workflow?: string;
    limit?: number;
}
export interface AgentDocumentationFetchRequest {
    origin: string;
    url: string;
    workflow?: string;
    query?: string;
}
export interface AgentDocumentationCacheQuery {
    origin: string;
    workflow?: string;
    query?: string;
    limit?: number;
}
export type AgentExecutionReason = 'scheduled' | 'manual' | 'resume' | 'retry';
export interface AgentControlExecutionRequest {
    type: 'AGENT_CONTROL_EXECUTION_REQUEST';
    requestId: string;
    strategy: AgentStrategyRecord;
    issuedAt: number;
    reason: AgentExecutionReason;
    deadlineAt?: number;
}
export type AgentExecutionOutcome = 'completed' | 'waiting' | 'failed' | 'stopped';
export interface AgentControlExecutionResult {
    type: 'AGENT_CONTROL_EXECUTION_RESULT';
    requestId: string;
    strategyId: string;
    success: boolean;
    outcome: AgentExecutionOutcome;
    detail: string;
    observedAt: number;
    nextRunAt?: number;
    task?: AgentTaskRecord | null;
    errorCode?: string;
}
export type AgentNotificationKind = 'strategy_completed' | 'strategy_failed' | 'strategy_paused' | 'approval_required' | 'budget_exhausted';
export interface AgentControlNotificationEvent {
    type: 'AGENT_CONTROL_NOTIFICATION';
    notificationId: string;
    kind: AgentNotificationKind;
    title: string;
    body: string;
    createdAt: number;
    strategyId?: string;
    origin?: string;
}
export interface AgentControlCapabilities {
    sidecar: boolean;
    localSigning: boolean;
    notifications: boolean;
}
export interface AgentControlSessionState {
    profileId?: string;
    openOrigins: string[];
    walletUnlocked: boolean;
}
export interface AgentControlBootstrapRequest {
    extensionId: string;
    profileId?: string;
    deviceLabel?: string;
    capabilities: AgentControlCapabilities;
    issuedAt: number;
}
export interface AgentControlJwtClaims {
    sub: string;
    extensionId: string;
    profileId?: string;
    scope: string[];
    iat: number;
    exp: number;
}
export interface AgentControlBootstrapResponse {
    sessionId: string;
    websocketUrl: string;
    token: string;
    claims: AgentControlJwtClaims;
    heartbeatIntervalMs: number;
}
export interface AgentControlSessionReadyEvent {
    type: 'AGENT_CONTROL_SESSION_READY';
    sessionId: string;
    heartbeatIntervalMs: number;
}
export interface AgentControlSessionHelloMessage {
    type: 'AGENT_CONTROL_SESSION_HELLO';
    sessionId: string;
    sentAt: number;
    capabilities: AgentControlCapabilities;
    state: AgentControlSessionState;
}
export interface AgentControlHeartbeatMessage {
    type: 'AGENT_CONTROL_HEARTBEAT';
    sessionId: string;
    sentAt: number;
    state: AgentControlSessionState;
}
export type AgentControlServerMessage = AgentControlSessionReadyEvent | AgentControlExecutionRequest | AgentControlNotificationEvent;
export type AgentControlClientMessage = AgentControlSessionHelloMessage | AgentControlHeartbeatMessage | AgentControlExecutionResult;
//# sourceMappingURL=index.d.ts.map