import { Outlet } from "react-router-dom";

const DashboardLayout = () => (
  <div>
    {/* Add your sidebar/header here if needed */}
    <main>
      <Outlet />
    </main>
  </div>
);

export default DashboardLayout;