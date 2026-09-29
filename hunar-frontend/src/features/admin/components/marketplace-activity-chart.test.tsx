import { render, screen } from "@testing-library/react";
import { MarketplaceActivityChart } from "./marketplace-activity-chart";

describe("MarketplaceActivityChart", () => {
  it("renders chart container", () => {
    render(<MarketplaceActivityChart />);
    expect(screen.getByText(/marketplace activity chart/i)).toBeInTheDocument();
  });

  it("renders legend with correct labels", () => {
    render(<MarketplaceActivityChart />);
    expect(screen.getByText("Jobs Posted")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Disputes")).toBeInTheDocument();
  });

  it("renders day labels", () => {
    render(<MarketplaceActivityChart />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("displays growth and completion rate", () => {
    render(<MarketplaceActivityChart />);
    expect(screen.getByText(/activity growth this week/i)).toBeInTheDocument();
    expect(screen.getByText(/avg completion rate/i)).toBeInTheDocument();
  });
});