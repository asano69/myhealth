import { useNavigate } from "@solidjs/router";
import { pb } from "../shared/api/pb.js";
import QuoteForm from "./QuoteForm.jsx";

export default function QuoteInputPage() {
  const navigate = useNavigate();

  const addLog = async (data) => {
    try {
      await pb.collection("quote_cards").create(data);
      navigate("/quote"); // go to the list page after saving
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <h1>Add Card</h1>
      <QuoteForm onAdd={addLog} />
    </div>
  );
}
