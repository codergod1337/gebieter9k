import Spinner from 'react-bootstrap/Spinner'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AccessRoleTab } from './admin/accessrole/AccessRoleTab.tsx'
import { AccessRoleCollectionTab } from './admin/accessrolecollection/AccessRoleCollectionTab.tsx'
import { EditAccessRoleCollectionTab } from './admin/accessrolecollection/EditAccessRoleCollectionTab.tsx'
import { AchievementManager } from './achievementmanager/AchievementManager.tsx'
import { AchievementTab } from './achievementmanager/achievement/AchievementTab.tsx'
import { EditAchievementTab } from './achievementmanager/achievement/EditAchievementTab.tsx'
import { NewAchievementTab } from './achievementmanager/achievement/NewAchievementTab.tsx'
import { EditPointActivityTab } from './achievementmanager/pointactivity/EditPointActivityTab.tsx'
import { NewPointActivityTab } from './achievementmanager/pointactivity/NewPointActivityTab.tsx'
import { PointActivityTab } from './achievementmanager/pointactivity/PointActivityTab.tsx'
import { ShopCategoryTab } from './achievementmanager/shopcategory/ShopCategoryTab.tsx'
import { Admin } from './admin/Admin.tsx'
import { AccessRoleCollectionAccessRoleMatrixTab } from './admin/arcar/AccessRoleCollectionAccessRoleMatrixTab.tsx'
import { EditFileClassTab } from './admin/fileclass/EditFileClassTab.tsx'
import { FileClassAccessRoleMatrixTab } from './admin/fileclass/FileClassAccessRoleMatrixTab.tsx'
import { FileClassDestinationTab } from './admin/fileclass/FileClassDestinationTab.tsx'
import { FileClassFileExtensionMatrixTab } from './admin/fileclass/FileClassFileExtensionMatrixTab.tsx'
import { FileClassTab } from './admin/fileclass/FileClassTab.tsx'
import { NewFileClassTab } from './admin/fileclass/NewFileClassTab.tsx'
import { EditFileExtensionGroupTab } from './admin/fileextension/EditFileExtensionGroupTab.tsx'
import { EditFileExtensionTab } from './admin/fileextension/EditFileExtensionTab.tsx'
import { FileExtensionTab } from './admin/fileextension/FileExtensionTab.tsx'
import { NewFileExtensionGroupTab } from './admin/fileextension/NewFileExtensionGroupTab.tsx'
import { NewFileExtensionTab } from './admin/fileextension/NewFileExtensionTab.tsx'
import { MailTestTab } from './admin/mailtest/MailTestTab.tsx'
import { EditRankTab } from './admin/rank/EditRankTab.tsx'
import { NewRankTab } from './admin/rank/NewRankTab.tsx'
import { RankTab } from './admin/rank/RankTab.tsx'
import { UsersArcMatrixTab } from './admin/userarc/UsersArcMatrixTab.tsx'
import { EditUsersTab } from './admin/users/EditUsersTab.tsx'
import { UsersTab } from './admin/users/UsersTab.tsx'
import { RequireAccessRole } from './auth/access/RequireAccessRole.tsx'
import { RequireAdmin } from './auth/access/RequireAdmin.tsx'
import { LoginOrRegistration } from './auth/LoginOrRegistration.tsx'
import { SessionProvider } from './auth/login/SessionProvider.tsx'
import { UsersSettingProvider } from './userssetting/UsersSettingProvider.tsx'
import { useCurrentSession } from './auth/login/useCurrentSession.ts'
import { Toasts } from './components/Toasts.tsx'
import { FileDocumentDetailPage } from './file/document/FileDocumentDetailPage.tsx'
import { FileDocumentViewerPage } from './file/document/FileDocumentViewerPage.tsx'
import { FileDocumentModule } from './file/document/FileDocumentModule.tsx'
import { FileManager } from './filemanager/FileManager.tsx'
import { FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS } from './filemanager/fileManagerEntryAccessRoleKeys.ts'
import { FileDocumentListTab } from './filemanager/files/FileDocumentListTab.tsx'
import { FileUploadTab } from './filemanager/upload/FileUploadTab.tsx'
import { Home } from './home/Home.tsx'
import { AppFooter } from './layout/AppFooter.tsx'
import { AppHeader } from './layout/AppHeader.tsx'
import { useMasterData } from './masterdata/useMasterData.ts'
import { OwnProfileRedirect } from './profile/OwnProfileRedirect.tsx'
import { Profile } from './profile/Profile.tsx'
import { ProfileHome } from './profile/ProfileHome.tsx'
import { GalleryListTab } from './gallery/GalleryListTab.tsx'
import { GalleryPage } from './gallery/GalleryPage.tsx'
import { SolrCoreFieldsTab } from './solrmanager/SolrCoreFieldsTab.tsx'
import { Market } from './market/Market.tsx'
import { MarketCategoryTab } from './market/MarketCategoryTab.tsx'
import { MarketStartTab } from './market/MarketStartTab.tsx'
import { SolrManager } from './solrmanager/SolrManager.tsx'
import { SolrManagerStartTab } from './solrmanager/SolrManagerStartTab.tsx'
import { IconManager } from './iconmanager/IconManager.tsx'
import { ScrollMemory } from './navigation/ScrollMemory.tsx'
import { TikaTest } from './tikatest/TikaTest.tsx'

/** Wurzel der Anwendung: Sitzung, die eigenen Einstellungen, Router und das Grundgerüst. */
function App() {
  return (
    <SessionProvider>
      <UsersSettingProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </UsersSettingProvider>
    </SessionProvider>
  )
}

/**
 * Das Grundgerüst jeder Seite, wie in der Vorlage: Header, Main, Footer. In Main rendert das Modul selbst, optional
 * seinen Subheader, dann seinen Inhalt. Der Footer steht am Ende der Seite. Darüber schweben unten rechts die Toasts.
 * Das Scroll-Gedächtnis merkt sich die Höhe je Eintrag im Verlauf ({@link ScrollMemory}).
 */
function AppLayout() {
  return (
    <>
      <ScrollMemory />
      <AppHeader />
      <main className="main">
        <AppRoutes />
      </main>
      <AppFooter />
      <Toasts />
    </>
  )
}

/**
 * Die Bestätigungsseite der 2FA geht immer, sie öffnet sich in einem neuen Fenster. Ohne Anmeldung gibt es sonst nur
 * Login und Registrierung, angemeldet die Module. Administration, SolrManager, Tika-Test und Icon-Manager stehen
 * zusätzlich hinter dem Admin-Wächter, ihre Tabs sind Routen.
 */
function AppRoutes() {
  const { session, isRestoring } = useCurrentSession()

  if (isRestoring) {
    return (
      <div className="main-content">
        <Spinner animation="border" />
      </div>
    )
  }
  return (
    <Routes>
      {session === null && <Route path="*" element={<LoginPage />} />}
      {session !== null && <Route path="*" element={<LoggedInRoutes />} />}
    </Routes>
  )
}

/** Login oder Registrierung, mittig. */
function LoginPage() {
  return (
    <div className="main-content">
      <LoginOrRegistration />
    </div>
  )
}

/** Die Module für Angemeldete. Die Stammdaten lädt erst die Anmeldung, ihre Endpunkte brauchen ein Token. */
function LoggedInRoutes() {
  useMasterData()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<OwnProfileRedirect />} />
      <Route path="/profile/:usersGuid" element={<Profile />}>
        <Route index element={<ProfileHome />} />
        <Route path="galleries" element={<GalleryListTab />} />
        <Route path="galleries/:galleryId" element={<GalleryPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        }>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UsersTab />} />
        <Route path="users/edit/:guid" element={<EditUsersTab />} />
        <Route path="access-role" element={<AccessRoleTab />} />
        <Route path="access-role-collection" element={<AccessRoleCollectionTab />} />
        <Route
          path="access-role-collection/edit/:accessRoleCollectionKey"
          element={<EditAccessRoleCollectionTab />}
        />
        <Route path="users-arc" element={<UsersArcMatrixTab />} />
        <Route path="arc-ar" element={<AccessRoleCollectionAccessRoleMatrixTab />} />
        <Route path="rank" element={<RankTab />} />
        <Route path="rank/new" element={<NewRankTab />} />
        <Route path="rank/edit/:rankKey" element={<EditRankTab />} />
        <Route path="file-class" element={<FileClassTab />} />
        <Route path="file-class/new" element={<NewFileClassTab />} />
        <Route path="file-class/edit/:fileClassKey" element={<EditFileClassTab />} />
        <Route path="file-extension" element={<FileExtensionTab />} />
        <Route path="file-extension/new" element={<NewFileExtensionTab />} />
        <Route path="file-extension/edit/:fileExtension" element={<EditFileExtensionTab />} />
        <Route path="file-extension/group/new" element={<NewFileExtensionGroupTab />} />
        <Route path="file-extension/group/edit/:fileExtensionGroupKey" element={<EditFileExtensionGroupTab />} />
        <Route path="mail-test" element={<MailTestTab />} />
        <Route path="file-class-extension" element={<FileClassFileExtensionMatrixTab />} />
        <Route path="file-class-destination" element={<FileClassDestinationTab />} />
        <Route path="file-class-ar" element={<FileClassAccessRoleMatrixTab />} />
      </Route>
      <Route
        path="/file-manager"
        element={
          <RequireAccessRole accessRoleKeys={FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS}>
            <FileManager />
          </RequireAccessRole>
        }>
        <Route index element={<Navigate to="upload" replace />} />
        <Route path="upload" element={<FileUploadTab />} />
        <Route path="files" element={<FileDocumentListTab />} />
      </Route>
      <Route path="/file/:fileDocumentId" element={<FileDocumentModule />}>
        <Route index element={<FileDocumentDetailPage />} />
        <Route path="viewer" element={<FileDocumentViewerPage />} />
      </Route>
      <Route
        path="/achievement-manager"
        element={
          <RequireAdmin>
            <AchievementManager />
          </RequireAdmin>
        }>
        <Route index element={<Navigate to="achievement" replace />} />
        <Route path="achievement" element={<AchievementTab />} />
        <Route path="achievement/new" element={<NewAchievementTab />} />
        <Route path="achievement/edit/:achievementKey" element={<EditAchievementTab />} />
        <Route path="point-activity" element={<PointActivityTab />} />
        <Route path="point-activity/new" element={<NewPointActivityTab />} />
        <Route path="point-activity/edit/:pointActivityKey" element={<EditPointActivityTab />} />
        <Route path="shop-category" element={<ShopCategoryTab />} />
      </Route>
      <Route path="/market" element={<Market />}>
        <Route index element={<MarketStartTab />} />
        <Route path="category/:shopCategoryKey" element={<MarketCategoryTab />} />
      </Route>
      <Route
        path="/solrmanager"
        element={
          <RequireAdmin>
            <SolrManager />
          </RequireAdmin>
        }>
        <Route index element={<SolrManagerStartTab />} />
        <Route path="core/:solrCoreKey" element={<SolrCoreFieldsTab />} />
      </Route>
      <Route
        path="/tika-test"
        element={
          <RequireAdmin>
            <TikaTest />
          </RequireAdmin>
        }
      />
      <Route
        path="/icon-manager"
        element={
          <RequireAdmin>
            <IconManager />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
