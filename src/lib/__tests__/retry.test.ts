import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals"
import { calculateBackoff, withRetry } from "@/lib/retry"

describe("calculateBackoff", () => {
  it("returns baseDelay for attempt 0 with no jitter", () => {
    jest.spyOn(Math, "random").mockReturnValue(0)
    const result = calculateBackoff(0, 1000)
    expect(result).toBe(1000)
    jest.restoreAllMocks()
  })

  it("doubles each attempt with no jitter", () => {
    jest.spyOn(Math, "random").mockReturnValue(0)
    expect(calculateBackoff(0, 1000)).toBe(1000)
    expect(calculateBackoff(1, 1000)).toBe(2000)
    expect(calculateBackoff(2, 1000)).toBe(4000)
    jest.restoreAllMocks()
  })

  it("includes jitter in result", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5)
    const result = calculateBackoff(1, 1000)
    expect(result).toBeGreaterThanOrEqual(2000)
    expect(result).toBeLessThanOrEqual(3000)
    jest.restoreAllMocks()
  })

  it("works with custom base delay", () => {
    jest.spyOn(Math, "random").mockReturnValue(0)
    expect(calculateBackoff(2, 500)).toBe(2000)
    jest.restoreAllMocks()
  })
})

describe("withRetry", () => {
  beforeEach(() => {
    jest.spyOn(global, "setTimeout").mockImplementation((fn: () => void) => {
      fn()
      return 0 as unknown as NodeJS.Timeout
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("resolves on first attempt if fn succeeds", async () => {
    const fn = jest.fn<() => Promise<string>>().mockResolvedValue("ok")
    const result = withRetry(fn)
    await expect(result).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries on failure and eventually succeeds", async () => {
    const fn = jest.fn<() => Promise<string>>()
    fn.mockRejectedValueOnce(new Error("fail"))
    fn.mockRejectedValueOnce(new Error("fail"))
    fn.mockResolvedValueOnce("ok")

    const result = withRetry(fn)
    await expect(result).resolves.toBe("ok")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("throws after exhausting maxRetries", async () => {
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error("persistent"))

    const result = withRetry(fn, { maxRetries: 2 })
    await expect(result).rejects.toThrow("persistent")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("calls onRetry callback with attempt number and error", async () => {
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error("oops"))
    const onRetry = jest.fn()

    const result = withRetry(fn, { maxRetries: 1, onRetry })
    await expect(result).rejects.toThrow("oops")
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))
  })

  it("wraps non-Error thrown values in Error", async () => {
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue("string error")

    const result = withRetry(fn, { maxRetries: 1 })
    await expect(result).rejects.toBe("string error")
  })

  it("respects default maxRetries of 3", async () => {
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error("fail"))

    const result = withRetry(fn)
    await expect(result).rejects.toThrow("fail")
    expect(fn).toHaveBeenCalledTimes(4)
  })
})
