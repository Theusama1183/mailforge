import { render, screen } from "@testing-library/react"
import { PageHeader } from "@/components/page-header"

jest.mock("@/components/workspace-provider", () => ({
  useWorkspace: () => ({ activeWorkspace: null, workspaces: [] }),
}))

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<PageHeader title="Dashboard" description="Welcome back" />)
    expect(screen.getByText("Welcome back")).toBeInTheDocument()
  })

  it("renders children in the leading section", () => {
    render(
      <PageHeader title="Dashboard">
        <span data-testid="child">Extra</span>
      </PageHeader>
    )
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("renders actions", () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button data-testid="action-btn">Action</button>}
      />
    )
    expect(screen.getByTestId("action-btn")).toBeInTheDocument()
  })

  it("renders title and children together", () => {
    render(
      <PageHeader title="Settings">
        <span data-testid="child">Breadcrumb</span>
      </PageHeader>
    )
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })
})
