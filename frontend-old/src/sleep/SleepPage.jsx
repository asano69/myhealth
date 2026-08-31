import { createSignal, onMount, For } from "solid-js";
import { pb } from "../shared/api/pb.js";
import SleepChart from "./SleepChart.jsx";
import "./SleepPage.css";

function nowDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

export default function Sleep() {
  const [date, setDate] = createSignal(nowDate());
  const [time, setTime] = createSignal(nowTime());
  const [quality, setQuality] = createSignal("3");
  const [tags, setTags] = createSignal("");
  const [recentLogs, setRecentLogs] = createSignal([]);

  // "date" has a unique index, so sorting by it alone is enough to get
  // chronological order (no need for a secondary sort on "time").
  const loadRecent = async () => {
    try {
      const res = await pb
        .collection("sleep_logs")
        .getList(1, 7, { sort: "-date" });
      setRecentLogs(res.items);
    } catch (error) {
      console.error("Failed to load recent logs:", error);
    }
  };

  onMount(loadRecent);

  const addLog = async (e) => {
    e.preventDefault();

    try {
      await pb.collection("sleep_logs").create({
        date: date(),
        time: time(),
        quality: Number(quality()),
        tags: tags()
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });

      setDate(nowDate());
      setTime(nowTime());
      setQuality("3");
      setTags("");
      await loadRecent();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h1>Sleep Log</h1>
      <form onSubmit={addLog}>
        <input
          type="date"
          value={date()}
          onInput={(e) => setDate(e.currentTarget.value)}
          required
        />
        <input
          type="time"
          value={time()}
          onInput={(e) => setTime(e.currentTarget.value)}
          required
        />
        <select
          value={quality()}
          onChange={(e) => setQuality(e.currentTarget.value)}
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
        <input
          type="text"
          value={tags()}
          onInput={(e) => setTags(e.currentTarget.value)}
          placeholder="tags (comma separated)"
        />
        <button type="submit">Add</button>
      </form>

      <SleepChart logs={recentLogs()} />

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>date</th>
              <th>time</th>
              <th>quality</th>
              <th>tags</th>
            </tr>
          </thead>

          <tbody>
            <For each={recentLogs()}>
              {(log) => (
                <tr>
                  <td>{log.date}</td>
                  <td>{log.time}</td>
                  <td>{log.quality}</td>
                  <td>{log.tags?.join(", ")}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
