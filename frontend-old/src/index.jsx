/* @refresh reload */
import { render } from "solid-js/web";
/*import '@picocss/pico/css/pico.min.css'*/
import "./index.css";
import App from "./App.jsx";

const root = document.getElementById("root");

render(() => <App />, root);

