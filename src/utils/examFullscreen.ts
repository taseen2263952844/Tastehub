export interface StoredExamViolation {
  attemptId: string;
  violationReason: string;
  violationTimestamp: string;
  startedAtMs: number;
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const docEl = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  };
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    mozFullScreenEnabled?: boolean;
    msFullscreenEnabled?: boolean;
  };

  const apiPresent = Boolean(
    docEl?.requestFullscreen ||
      docEl?.webkitRequestFullscreen ||
      docEl?.mozRequestFullScreen ||
      docEl?.msRequestFullscreen
  );
  if (!apiPresent) return false;

  if (typeof doc.fullscreenEnabled === 'boolean') return doc.fullscreenEnabled;
  if (typeof doc.webkitFullscreenEnabled === 'boolean') return doc.webkitFullscreenEnabled;
  if (typeof doc.mozFullScreenEnabled === 'boolean') return doc.mozFullScreenEnabled;
  if (typeof doc.msFullscreenEnabled === 'boolean') return doc.msFullscreenEnabled;
  return true;
}

export function isInFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(
    doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
  );
}

export async function requestExamFullscreen(
  target?: HTMLElement | null
): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (isInFullscreen()) return true;

  const el = (target || document.documentElement) as HTMLElement & {
    webkitRequestFullscreen?: (options?: any) => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  };
  if (!el) return false;

  try {
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
      } catch {
        await el.requestFullscreen();
      }
      return isInFullscreen() || true;
    }
    if (el.webkitRequestFullscreen) {
      await Promise.resolve(el.webkitRequestFullscreen());
      return true;
    }
    if (el.mozRequestFullScreen) {
      await Promise.resolve(el.mozRequestFullScreen());
      return true;
    }
    if (el.msRequestFullscreen) {
      await Promise.resolve(el.msRequestFullscreen());
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function exitExamFullscreen(): Promise<void> {
  if (typeof document === 'undefined' || !isInFullscreen()) return;
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    mozCancelFullScreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await Promise.resolve(doc.webkitExitFullscreen());
    } else if (doc.mozCancelFullScreen) {
      await Promise.resolve(doc.mozCancelFullScreen());
    } else if (doc.msExitFullscreen) {
      await Promise.resolve(doc.msExitFullscreen());
    }
  } catch {
    // Ignore errors if fullscreen already exited
  }
}

export function onFullscreenChange(handler: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const events = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
  ];
  events.forEach((evt) => document.addEventListener(evt, handler));
  return () => {
    events.forEach((evt) => document.removeEventListener(evt, handler));
  };
}

export function getAttemptViolationStorageKey(attemptId: string): string {
  return `sofs_exam_violation_v1_${attemptId}`;
}

export function readStoredExamViolation(attemptId: string): StoredExamViolation | null {
  if (typeof window === 'undefined' || !attemptId) return null;
  try {
    const raw = window.localStorage.getItem(getAttemptViolationStorageKey(attemptId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredExamViolation;
    if (!parsed || parsed.attemptId !== attemptId || !Number.isFinite(parsed.startedAtMs)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredExamViolation(violation: StoredExamViolation): void {
  if (typeof window === 'undefined' || !violation.attemptId) return;
  try {
    window.localStorage.setItem(
      getAttemptViolationStorageKey(violation.attemptId),
      JSON.stringify(violation)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredExamViolation(attemptId: string): void {
  if (typeof window === 'undefined' || !attemptId) return;
  try {
    window.localStorage.removeItem(getAttemptViolationStorageKey(attemptId));
  } catch {
    // Ignore
  }
}
