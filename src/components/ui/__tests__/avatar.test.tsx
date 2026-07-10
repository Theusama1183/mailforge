import { render, screen } from "@testing-library/react"
import { Avatar } from "@/components/ui/avatar"

describe("Avatar", () => {
  it("renders initials from a single name", () => {
    render(<Avatar name="Usama" />)
    expect(screen.getByText("U")).toBeInTheDocument()
  })

  it("renders initials from a full name", () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("renders at most two initials", () => {
    render(<Avatar name="Alice Bob Charlie" />)
    expect(screen.getByText("AB")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Avatar name="Test" className="ring-2 ring-blue-500" />)
    const el = screen.getByText("T")
    expect(el.className).toContain("ring-2")
    expect(el.className).toContain("ring-blue-500")
  })

  it("applies size classes for sm", () => {
    render(<Avatar name="Test" size="sm" />)
    const el = screen.getByText("T")
    expect(el.className).toContain("w-7")
    expect(el.className).toContain("h-7")
  })

  it("applies size classes for md", () => {
    render(<Avatar name="Test" size="md" />)
    const el = screen.getByText("T")
    expect(el.className).toContain("w-9")
    expect(el.className).toContain("h-9")
  })

  it("applies size classes for lg", () => {
    render(<Avatar name="Test" size="lg" />)
    const el = screen.getByText("T")
    expect(el.className).toContain("w-12")
    expect(el.className).toContain("h-12")
  })

  it("assigns a deterministic color based on name", () => {
    const { container: c1 } = render(<Avatar name="Alice" />)
    const { container: c2 } = render(<Avatar name="Alice" />)
    const a = c1.querySelector("div")!.className.match(/bg-\w+-\d+/)
    const b = c2.querySelector("div")!.className.match(/bg-\w+-\d+/)
    expect(a![0]).toBe(b![0])
  })
})
