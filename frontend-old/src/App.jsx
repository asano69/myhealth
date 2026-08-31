import { Router, Route } from "@solidjs/router";

import Home from "./home/HomePage.jsx";
import About from "./about/AboutPage.jsx";
import Sleep from "./sleep/SleepPage.jsx";
import QuoteRoutes from "./quote/QuoteRoutes.jsx";

export default function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/sleep" component={Sleep} />
      <QuoteRoutes />
    </Router>
  );
}
