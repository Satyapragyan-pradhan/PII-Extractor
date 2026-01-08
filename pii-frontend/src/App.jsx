import { Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";


export default function App() {
return (
<Routes>
<Route path="/" element={<UploadPage />} />
<Route path="/results" element={<ResultsPage />} />
</Routes>
);
}