import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Redirect /roadmap to /mission#roadmap for backwards compatibility
export default function RoadmapPage() {
  const location = useLocation();
  
  // Scroll to roadmap section after redirect
  useEffect(() => {
    const element = document.getElementById('roadmap');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  return <Navigate to="/mission#roadmap" replace state={{ from: location }} />;
}