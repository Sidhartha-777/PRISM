import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Expeditions from './pages/public/Expeditions';
import ExpeditionDetail from './pages/public/ExpeditionDetail';
import Datasets from './pages/public/Datasets';
import DatasetDetail from './pages/public/DatasetDetail';
import Publications from './pages/public/Publications';
import MediaGallery from './pages/public/MediaGallery';
import News from './pages/public/News';
import Outreach from './pages/public/Outreach';
import Search from './pages/public/Search';

// Admin pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ContentStudio from './pages/admin/ContentStudio';
import PendingApprovals from './pages/admin/PendingApprovals';
import MySubmissions from './pages/admin/MySubmissions';
import UnifiedEntry from './pages/admin/UnifiedEntry';
import ExpeditionManager from './pages/admin/ExpeditionManager';
import DatasetManager from './pages/admin/DatasetManager';
import PublicationManager from './pages/admin/PublicationManager';
import MediaManager from './pages/admin/MediaManager';
import NewsManager from './pages/admin/NewsManager';
import UserManager from './pages/admin/UserManager';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/expeditions" element={<Expeditions />} />
        <Route path="/expeditions/:slug" element={<ExpeditionDetail />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/datasets/:slug" element={<DatasetDetail />} />
        <Route path="/publications" element={<Publications />} />
        <Route path="/media" element={<MediaGallery />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<Placeholder title="News Article" />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accessibility" element={<StaticPage title="Accessibility Statement" content="This portal is designed to be accessible to all users in compliance with WCAG 2.1 AA standards and GIGW 3.0 guidelines. Features include keyboard navigation, visible focus indicators, semantic HTML, text-size controls, and high-contrast colour choices. If you encounter any accessibility issues, please contact us." />} />
        <Route path="/terms" element={<StaticPage title="Terms of Use" content="This portal is maintained by the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India. Content is provided for informational and educational purposes. Datasets are available under their respective licences as specified in their metadata. Proper citation is required when using any data or publications from this portal." />} />
        <Route path="/privacy" element={<StaticPage title="Privacy Policy" content="This portal collects minimal personal data. Download logs are stored only with consent for usage analytics. We use httpOnly cookies for authentication. No personal data is shared with third parties. This portal complies with applicable Indian data protection regulations." />} />
        <Route path="/sitemap" element={<Placeholder title="Sitemap" />} />
        <Route path="/help" element={<StaticPage title="Help" content="For assistance with this portal, including data access, publication queries, or technical issues, please contact NCPOR at info@ncpor.gov.in or use the Contact page. For researchers needing dataset access, please register and submit a data access request through the Data Repository section." />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="approvals" element={<PendingApprovals />} />
        <Route path="my-submissions" element={<MySubmissions />} />
        <Route path="new-entry" element={<UnifiedEntry />} />
        <Route path="studio" element={<ContentStudio />} />
        <Route path="expeditions" element={<ExpeditionManager />} />
        <Route path="datasets" element={<DatasetManager />} />
        <Route path="publications" element={<PublicationManager />} />
        <Route path="media" element={<MediaManager />} />
        <Route path="news" element={<NewsManager />} />
        <Route path="users" element={<UserManager />} />
      </Route>
    </Routes>
  );
}

function Placeholder({ title }) {
  return (
    <div className="max-w-[1200px] mx-auto px-3 py-5">
      <h1 className="text-h1 mb-3">{title}</h1>
      <p className="text-[16px] font-sans text-slate-800">This page content is being developed.</p>
    </div>
  );
}

function StaticPage({ title, content }) {
  return (
    <div className="max-w-[1200px] mx-auto px-3 py-5">
      <h1 className="text-h1 mb-3">{title}</h1>
      <div className="bg-white rounded-card border border-line p-4">
        <p className="text-[16px] font-sans text-slate-800 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-3 py-5">
      <h1 className="text-h1 mb-3">Contact</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-card border border-line p-4">
          <h2 className="text-h2 mb-2">NCPOR Headquarters</h2>
          <dl className="space-y-2 text-[14px] font-sans">
            <div><dt className="text-slate-500">Address</dt><dd className="text-slate-800">Headland Sada, Vasco da Gama, Goa 403804, India</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="text-slate-800">+91-832-2525-600</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-slate-800">info@ncpor.gov.in</dd></div>
            <div><dt className="text-slate-500">Website</dt><dd className="text-slate-800">ncpor.res.in</dd></div>
          </dl>
        </div>
        <div className="bg-white rounded-card border border-line p-4">
          <h2 className="text-h2 mb-2">Media Enquiries</h2>
          <p className="text-[14px] font-sans text-slate-800 mb-2">For press and media enquiries, including requests for images, interviews, or press kits:</p>
          <p className="text-[14px] font-sans text-slate-800">Email: media@ncpor.gov.in</p>
          <h2 className="text-h2 mb-2 mt-4">Data Access</h2>
          <p className="text-[14px] font-sans text-slate-800">For dataset access queries or collaboration proposals, please contact the respective dataset contact listed in the Data Repository, or write to data@ncpor.gov.in.</p>
        </div>
      </div>
    </div>
  );
}
