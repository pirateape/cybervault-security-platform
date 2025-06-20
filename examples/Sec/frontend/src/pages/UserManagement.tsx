import UserManagementComponent from '../components/UserManagement';

function UserManagement() {
  // The main UserManagement page now delegates to the component that includes the reset password feature and all user management actions.
  return <UserManagementComponent />;
}

export default UserManagement;
