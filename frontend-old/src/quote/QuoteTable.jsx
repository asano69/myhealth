import { For } from "solid-js";

export default function QuoteTable(props) {
  return (
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>text</th>
            <th>note</th>
            <th>context</th>
            <th>tags</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.logs}>
            {(log) => (
              <tr>
                <td>{log.text}</td>
                <td>{log.note}</td>
                <td>{log.context}</td>
                <td>{log.tags?.join(", ")}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
