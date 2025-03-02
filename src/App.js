import React from "react";
import Graph from "./Graph";

function App() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Graph width={800} height={600} />
    </div>
  );
}

export default App;
