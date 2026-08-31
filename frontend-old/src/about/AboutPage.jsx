import { useNavigate } from "@solidjs/router";

export default function About() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>About</h1>
      <button onClick={() => navigate(-1)}>戻る</button>
    </div>
  );
}

