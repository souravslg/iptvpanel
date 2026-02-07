import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content-wrapper">
                {children}
            </main>
        </div>
    );
}
