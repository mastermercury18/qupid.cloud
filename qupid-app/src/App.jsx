import { HashRouter, Route, Routes } from "react-router-dom";
import QupidApp from "./QupidApp";

const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/*" element={<QupidApp />} />
    </Routes>
  </HashRouter>
);

export default App;
