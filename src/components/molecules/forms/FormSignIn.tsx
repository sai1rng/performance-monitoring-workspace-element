import { useMsal } from '@azure/msal-react';
import { Button } from '@bosch/react-frok';
import { handleMicrosoftLoginRedirect } from '@services/auth.service';
import { useState } from 'react';

const FormSignIn = () => {
  const [ssoLoading, setSSOLoading] = useState(false);
  const { instance } = useMsal();

  const handleMsLogin = async () => {
    setSSOLoading(true);
    try {
      await handleMicrosoftLoginRedirect(instance);
    } catch (error) {
      console.error('Error initiating Microsoft login:', error);
    } finally {
      setSSOLoading(false);
    }
  };

  return (
    <div className="w-[478px] p-12 text-sm">
      <div className="flex flex-col items-center gap-7">
        <img src="/imgs/bosch_logo.png" alt="Bosch Logo" className="max-w-[150px]" />
        <p>Login for employees / Login für Mitarbeitende</p>
        <Button
          mode="primary"
          label="Bosch Single-Sign-On"
          className="w-full"
          onClick={handleMsLogin}
          disabled={ssoLoading}
        />
        <p className="mb-3 mt-7 bg-bosch-blue-90 px-6 py-5 text-xs text-black">
          The Bosch SSO only works in the enterprise network. / Der Bosch SSO funktioniert nur aus dem
          Unternehmensnetzwerk.
        </p>
        {/* Temporary Disabled for This Version 1.0.0 */}
        {/* <Link to="/request-access">
          <Button
            mode="integrated"
            label="Request access"
            className="text-xs underline"
          />
        </Link> */}
      </div>
    </div>
  );
};

export default FormSignIn;
