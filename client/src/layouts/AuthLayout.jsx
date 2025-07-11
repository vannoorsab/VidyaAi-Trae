import React from "react";
import { Outlet } from "react-router-dom";

const AuthLayout = () => (
  <div>
    {/* Add your auth page layout here if needed */}
    <Outlet />
  </div>
);

export default AuthLayout;