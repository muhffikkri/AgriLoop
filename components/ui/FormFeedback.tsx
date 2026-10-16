/** Structural shape so any action module can feed this without importing across layers. */
export type FormFeedbackState = { error?: string; message?: string };

/**
 * One place that turns an action result into a readable message. Failures announce
 * themselves to assistive tech, successes are polite status updates.
 */
export function FormFeedback({ state }: { state: FormFeedbackState }) {
  if (state.error) {
    return (
      <p className="alert alert-error" role="alert" style={{ marginTop: 14 }}>
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="alert alert-info" role="status" style={{ marginTop: 14 }}>
        {state.message}
      </p>
    );
  }
  return null;
}

/** Field-level error text, wired to the input through `aria-describedby`. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="error-text" id={id}>
      {message}
    </p>
  );
}
