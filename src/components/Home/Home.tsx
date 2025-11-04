import './HomeDashboard.css';

export default function HomeDashboard() {
  return (
    <div className="dashboard-container vh-fill">
      <div className="dashboard-card" role="region" aria-label="Informe Helpdesk Power BI">
        <iframe
          title="Informe Helpdesk Power BI"
          src="https://app.powerbi.com/view?r=eyJrIjoiNGMxNGM3NTEtOWJlNC00ZTAzLThjYWQtYjlhODAzMTI2YjVjIiwidCI6ImNkNDhlY2Q5LTdlMTUtNGY0Yi05N2Q5LWVjODEzZWU0MmIyYyIsImMiOjR9"
          allowFullScreen
        />
      </div>
    </div>
  );
}
