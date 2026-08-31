import { useNavigate } from "@solidjs/router";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Home</h1>
      <button onClick={() => navigate("/about")}>About へ行く</button>
      <button onClick={() => navigate("/sleep")}>Sleep へ行く</button>
    </div>
  );
}

