import AppearanceTabs from '@/components/appearance-tabs';
import AccountLayout from '@/layouts/account-layout';

export default function Appearance() {
    return (
        <AccountLayout title="Apariencia" description="Elige entre modo claro, oscuro o el de tu celular">
            <AppearanceTabs className="w-full" />
        </AccountLayout>
    );
}
