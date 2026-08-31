import { createSignal, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { pb } from "../shared/api/pb.js";
import QuoteTable from "./QuoteTable.jsx";
import "./QuotePage.css";

export default function QuoteListPage() {
  const [recentLogs, setRecentLogs] = createSignal([]);

  // No "date" field in this schema anymore, so sort by Pocketbase's
  // auto-generated "created" timestamp to get chronological order.
  const loadRecent = async () => {
    try {
      const res = await pb
        .collection("quote_cards")
        .getList(1, 7, { sort: "-created" });
      setRecentLogs(res.items);
    } catch (error) {
      console.error("Failed to load recent logs:", error);
    }
  };
  onMount(loadRecent);

  return (
    <div>
      <h1>Cardbox</h1>
      <A href="/quote/new">Add Card</A>
      <QuoteTable logs={recentLogs()} />
    </div>
  );
}
