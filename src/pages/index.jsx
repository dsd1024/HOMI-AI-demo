import Layout from "./Layout.jsx";

import HomiHub from "./HomiHub";

import PhotoMode from "./PhotoMode";

import ScanMode from "./ScanMode";

import BlueprintMode from "./BlueprintMode";

import Upload from "./Upload";

import Marketplace from "./Marketplace";

import Services from "./Services";

import Profile from "./Profile";

import DesignerProfile from "./DesignerProfile";

import ProviderProfile from "./ProviderProfile";

import ProductDetail from "./ProductDetail";

import StoreDetail from "./StoreDetail";

import AdminSetup from "./AdminSetup";

import Cart from "./Cart";

import Messages from "./Messages";

import Subscribe from "./Subscribe";

import HomiStudio from "./HomiStudio";

import MyProjects from "./MyProjects";

import Discover from "./Discover";

import MerchantCenter from "./MerchantCenter";

import PostDetail from "./PostDetail";

import ProjectDetail from "./ProjectDetail";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    HomiHub: HomiHub,
    
    PhotoMode: PhotoMode,
    
    ScanMode: ScanMode,
    
    BlueprintMode: BlueprintMode,
    
    Upload: Upload,
    
    Marketplace: Marketplace,
    
    Services: Services,
    
    Profile: Profile,
    
    DesignerProfile: DesignerProfile,
    
    ProviderProfile: ProviderProfile,
    
    ProductDetail: ProductDetail,
    
    StoreDetail: StoreDetail,
    
    AdminSetup: AdminSetup,
    
    Cart: Cart,
    
    Messages: Messages,
    
    Subscribe: Subscribe,
    
    HomiStudio: HomiStudio,
    
    MyProjects: MyProjects,
    
    Discover: Discover,
    
    MerchantCenter: MerchantCenter,
    
    PostDetail: PostDetail,
    
    ProjectDetail: ProjectDetail,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<HomiHub />} />
                
                
                <Route path="/HomiHub" element={<HomiHub />} />
                
                <Route path="/PhotoMode" element={<PhotoMode />} />
                
                <Route path="/ScanMode" element={<ScanMode />} />
                
                <Route path="/BlueprintMode" element={<BlueprintMode />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/Services" element={<Services />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/DesignerProfile" element={<DesignerProfile />} />
                
                <Route path="/ProviderProfile" element={<ProviderProfile />} />
                
                <Route path="/ProductDetail" element={<ProductDetail />} />
                
                <Route path="/StoreDetail" element={<StoreDetail />} />
                
                <Route path="/AdminSetup" element={<AdminSetup />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Subscribe" element={<Subscribe />} />
                
                <Route path="/HomiStudio" element={<HomiStudio />} />
                
                <Route path="/MyProjects" element={<MyProjects />} />
                
                <Route path="/Discover" element={<Discover />} />
                
                <Route path="/MerchantCenter" element={<MerchantCenter />} />
                
                <Route path="/PostDetail" element={<PostDetail />} />
                
                <Route path="/ProjectDetail" element={<ProjectDetail />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}