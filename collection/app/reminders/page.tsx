import { getCustomers } from '@/app/actions'
import { CustomerPageClient } from '@/components/customer-page-client'

export default async function RemindersPage() {
  const customers = await getCustomers()
  return <CustomerPageClient initialCustomers={customers} />
}
