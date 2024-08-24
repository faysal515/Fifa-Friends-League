import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import PublicTournament from "./TournamentPublicView";
import reportWebVitals from "./reportWebVitals";

import {
  RouterProvider,
  Route,
  RootRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = new RootRoute();

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const tournamentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/t",
  component: PublicTournament,
});

const routeTree = rootRoute.addChildren([indexRoute, tournamentsRoute]);

const router = new createRouter({ routeTree });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

reportWebVitals();
