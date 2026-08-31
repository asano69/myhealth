import { Route } from "@solidjs/router";
import QuoteListPage from "./QuoteListPage.jsx";
import QuoteInputPage from "./QuoteInputPage.jsx";

export default function QuoteRoutes() {
  return (
    <>
      <Route path="/quote" component={QuoteListPage} />
      <Route path="/quote/new" component={QuoteInputPage} />
    </>
  );
}
