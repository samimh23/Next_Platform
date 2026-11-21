import { CustomerShell } from '@/components/customer/customer-shell';

/** The page the receipt QR opens: inside the customer app frame. */
export default function ReceiptLayout({ children }: LayoutProps<'/r'>) {
  return <CustomerShell>{children}</CustomerShell>;
}
