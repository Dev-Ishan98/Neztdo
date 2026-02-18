import { useLocation } from "react-router-dom";
import ProjectBoard from "./ProjectBoard";

/**
 * Wrapper that reads the project object passed via navigation state
 * and forwards it to ProjectBoard.
 */
export default function ProjectBoardWrapper() {
    const location = useLocation();
    const project = location.state?.project || null;

    return <ProjectBoard project={project} />;
}
