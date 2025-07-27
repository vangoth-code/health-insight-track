import { createRoot } from 'react-dom/client'
import './index.css'

console.log("main.tsx loaded");

const root = document.getElementById("root");
console.log("Root element:", root);

if (root) {
  const reactRoot = createRoot(root);
  console.log("React root created");
  
  reactRoot.render(
    <div style={{ padding: "20px", backgroundColor: "red", color: "white", fontSize: "24px" }}>
      <h1>EMERGENCY TEST - React is working!</h1>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
  console.log("React render called");
} else {
  console.error("No root element found!");
}
