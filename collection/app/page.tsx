import { createClient } from '@/utils/supabase/server'
import { getCustomers } from './actions'
import { DashboardOverview } from '@/components/dashboard-overview'
import { LandingPage } from '@/components/landing-page'

// Serves the public LandingPage for guests or the private DashboardOverview for members
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const customers = await getCustomers()
  
  return (
    <div className="p-4 font-sans sm:p-8 md:p-12">
      <div className="mx-auto max-w-7xl">
        <DashboardOverview initialCustomers={customers} />
      </div>
    </div>
  )
}

