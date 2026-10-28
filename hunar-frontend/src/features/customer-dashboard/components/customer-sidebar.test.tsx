import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomerSidebar } from "./customer-sidebar";
import { useStoredUser } from "@/lib/use-stored-user";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      dashboard: "Dashboard",
      help: "Help",
      language: "Language",
      verifiedBadge: "Verified",
      verifiedDesc: "Quality Guaranteed",
      qualityGuarantee: "100% Quality Guarantee",
    };
    return translations[key] || key;
  },
  useLocale: () => "en",
}));

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/customer/dashboard",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Link: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/shared/workerfix-logo", () => ({
  WorkerFixLogo: () => <div data-testid="logo">WorkerFIX</div>,
}));

jest.mock("@/lib/use-stored-user", () => ({
  useStoredUser: jest.fn(),
}));

jest.mock("@/features/customer-jobs/api/customer-jobs-api", () => ({
  getCustomerJobs: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/features/customer-profile/api/customer-profile-api", () => ({
  getCustomerProfile: jest.fn().mockResolvedValue({
    id: "c-123",
    fullName: "Ahmad Customer",
    avatarUrl: "https://example.com/customer-pic.jpg",
    avatarInitials: "AC",
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("CustomerSidebar", () => {
  beforeEach(() => {
    (useStoredUser as jest.Mock).mockReturnValue({
      id: "c-123",
      role: "CUSTOMER",
      name: "Ahmad Customer",
      avatarUrl: "https://example.com/customer-pic.jpg",
    });
  });

  it("renders navigation links", () => {
    renderWithClient(<CustomerSidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my bookings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /help/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /customer profile/i })).toBeInTheDocument();
  });

  it("renders saved customer profile picture and first name only", () => {
    renderWithClient(<CustomerSidebar />);
    const profileImg = screen.getByRole("img", { name: /ahmad/i });
    expect(profileImg).toBeInTheDocument();
    expect(profileImg).toHaveAttribute("src", "https://example.com/customer-pic.jpg");
    expect(screen.getByText("Ahmad")).toBeInTheDocument();
    expect(screen.queryByText("Ahmad Customer")).not.toBeInTheDocument();
  });

  it("renders logo", () => {
    renderWithClient(<CustomerSidebar />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("renders Sign In link instead of Sign Out button when user is a Guest", () => {
    (useStoredUser as jest.Mock).mockReturnValue(null);
    renderWithClient(<CustomerSidebar />);
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /sign in/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });
});