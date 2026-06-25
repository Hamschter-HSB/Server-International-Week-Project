/**
 * Singleton encapsulating the response of a controller function.
 *  - error: integer (0 = success, otherwise an error code)
 *  - data: payload (any type)
 *  - context: optional structured details about an error (null when none)
 */
class ControllerAnswer {
  constructor() {
    if (ControllerAnswer.exists) {
      return ControllerAnswer.singleton;
    }
    this.error = 0;
    this.data = null;
    this.context = null;
    ControllerAnswer.exists = true;
    ControllerAnswer.singleton = this;
    return this;
  }

  reset() {
    this.error = 0;
    this.data = null;
    this.context = null;
  }

  set(obj) {
    this.error = obj.error;
    this.data = obj.data;
    this.context = obj.context ?? null;
  }

  setError(error) { this.error = error; }
  setPayload(data) { this.data = data; }
  getPayload() { return this.data; }
  isError() { return this.error !== 0; }
  getError() { return this.error; }
}

export const answer = new ControllerAnswer();
