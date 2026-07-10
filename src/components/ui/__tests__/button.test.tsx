import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument()
  })

  it("applies default variant classes", () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("bg-blue-600")
    expect(button.className).toContain("text-white")
  })

  it("applies primary variant classes", () => {
    render(<Button variant="default">Primary</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("bg-blue-600")
  })

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("text-gray-600")
    expect(button.className).toContain("hover:bg-gray-100")
  })

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("border")
    expect(button.className).toContain("border-gray-200")
  })

  it("fires onClick when clicked", () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("does not fire onClick when disabled", () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    fireEvent.click(screen.getByRole("button"))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("applies disabled styles", () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole("button")
    expect(button.className).toContain("disabled:opacity-50")
    expect(button).toBeDisabled()
  })
})
