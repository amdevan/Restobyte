import React, { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { getMenuItems, getCategories, getOrders, getCustomers, BackendOrder, BackendCustomer } from '@/services/api';
import { FiDatabase, FiRefreshCw, FiList, FiUsers, FiShoppingCart, FiLayers, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AccessDataPage: React.FC = () => {
  const { websiteSettings, preMadeFoodItems, employees, getSingleActiveOutlet } = useRestaurantData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ menuItems: 0, categories: 0, orders: 0, customers: 0 });
  const [recentOrders, setRecentOrders] = useState<BackendOrder[]>([]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, cats, orders, customers] = await Promise.all([
        getMenuItems().catch(() => []),
        getCategories().catch(() => []),
        getOrders().catch(() => [] as BackendOrder[]),
        getCustomers().catch(() => [] as BackendCustomer[]),
      ]);
      setCounts({ menuItems: items.length, categories: cats.length, orders: orders.length, customers: customers.length });
      setRecentOrders(orders.slice(0, 5));
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch website data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const local = {
    availableFoods: (websiteSettings.availableOnlineFoodIds || []).length,
    receivers: (websiteSettings.orderReceivingUserIds || []).length,
    gallery: (websiteSettings.homePageContent?.gallery || []).length,
    socialLinks: (websiteSettings.homePageContent?.socialMedia || []).length,
    contactMessages: (websiteSettings.contactMessages || []).length,
    orderingEnabled: !!websiteSettings.orderEnabled,
  };

  const outlet = getSingleActiveOutlet();
  const accessibleFoods = preMadeFoodItems.filter(f => (websiteSettings.availableOnlineFoodIds || []).includes(f.id));
  const receivingUsers = employees.filter(e => (websiteSettings.orderReceivingUserIds || []).includes(e.id));

  const getPriceRange = (variations: { price: number }[]) => {
    if (!variations || variations.length === 0) return '-';
    const prices = variations.map(v => v.price).filter(p => typeof p === 'number');
    if (prices.length === 0) return '-';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min}` : `${min} - ${max}`;
  };

  return (
    <div className="p-6">
      <Card title="Website Data Overview" icon={<FiDatabase /> }>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Consolidated view of public website data from backend and local settings.</p>
            <Button onClick={refresh} leftIcon={<FiRefreshCw />} isLoading={loading}>Refresh</Button>
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiList /> <span>Menu Items (backend)</span></div>
              <div className="text-2xl font-semibold">{counts.menuItems}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiLayers /> <span>Categories (backend)</span></div>
              <div className="text-2xl font-semibold">{counts.categories}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiShoppingCart /> <span>Orders (backend)</span></div>
              <div className="text-2xl font-semibold">{counts.orders}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiUsers /> <span>Customers (backend)</span></div>
              <div className="text-2xl font-semibold">{counts.customers}</div>
            </div>

            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiList /> <span>Available Online Foods (local)</span></div>
              <div className="text-2xl font-semibold">{local.availableFoods}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiUsers /> <span>Order Receiving Users (local)</span></div>
              <div className="text-2xl font-semibold">{local.receivers}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiLayers /> <span>Gallery Photos (local)</span></div>
              <div className="text-2xl font-semibold">{local.gallery}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiLayers /> <span>Social Links (local)</span></div>
              <div className="text-2xl font-semibold">{local.socialLinks}</div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2"><FiUsers /> <span>Contact Messages (local)</span></div>
              <div className="text-2xl font-semibold">{local.contactMessages}</div>
            </div>
          </div>

          {/* Preview quick links */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/public/restaurant')} leftIcon={<FiExternalLink />}>Preview Public Site</Button>
            <Button onClick={() => navigate('/public/restaurant#menu')} leftIcon={<FiExternalLink />}>Preview Public Menu</Button>
            {outlet?.id && (
              <>
                <Button onClick={() => navigate(`/public/restaurant/${outlet.id}`)} leftIcon={<FiExternalLink />}>Preview Current Outlet</Button>
                <Button onClick={() => navigate(`/public/restaurant/${outlet.id}#menu`)} leftIcon={<FiExternalLink />}>Preview Outlet Menu</Button>
              </>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Recent Orders</h4>
            <div className="rounded border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Customer</th>
                    <th className="text-left px-3 py-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 && (
                    <tr>
                      <td className="px-3 py-3 text-gray-500" colSpan={5}>No orders found.</td>
                    </tr>
                  )}
                  {recentOrders.map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="px-3 py-2">{o.id}</td>
                      <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{o.status}</td>
                      <td className="px-3 py-2">{o.customer?.name || '-'}</td>
                      <td className="px-3 py-2">{(o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Accessible resources detail lists */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-gray-800">Available Online Foods</h4>
                <Button onClick={() => navigate('/app/website-settings/available-online-foods')} variant="secondary">Configure</Button>
              </div>
              <div className="rounded border overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Category</th>
                      <th className="text-left px-3 py-2">Variations</th>
                      <th className="text-left px-3 py-2">Price Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleFoods.length === 0 && (
                      <tr><td className="px-3 py-3 text-gray-500" colSpan={4}>No foods selected for online ordering.</td></tr>
                    )}
                    {accessibleFoods.map(f => (
                      <tr key={f.id} className="border-t">
                        <td className="px-3 py-2">{f.name}</td>
                        <td className="px-3 py-2">{f.category || '-'}</td>
                        <td className="px-3 py-2">{f.variations?.length || 0}</td>
                        <td className="px-3 py-2">{getPriceRange(f.variations || [])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-gray-800">Order Receiving Users</h4>
                <Button onClick={() => navigate('/app/website-settings/order-receiving-user')} variant="secondary">Configure</Button>
              </div>
              <div className="rounded border overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Employee ID</th>
                      <th className="text-left px-3 py-2">Phone</th>
                      <th className="text-left px-3 py-2">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivingUsers.length === 0 && (
                      <tr><td className="px-3 py-3 text-gray-500" colSpan={4}>No receiving users configured.</td></tr>
                    )}
                    {receivingUsers.map(u => (
                      <tr key={u.id} className="border-t">
                        <td className="px-3 py-2">{u.name}</td>
                        <td className="px-3 py-2">{u.employeeId}</td>
                        <td className="px-3 py-2">{u.phone}</td>
                        <td className="px-3 py-2">{u.isActive ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-gray-800">Social Links</h4>
                <Button onClick={() => navigate('/app/website-settings/home/social-media')} variant="secondary">Configure</Button>
              </div>
              <div className="rounded border overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2">Platform</th>
                      <th className="text-left px-3 py-2">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(websiteSettings.homePageContent?.socialMedia || []).length === 0 && (
                      <tr><td className="px-3 py-3 text-gray-500" colSpan={2}>No social links configured.</td></tr>
                    )}
                    {(websiteSettings.homePageContent?.socialMedia || []).map(link => (
                      <tr key={link.id} className="border-t">
                        <td className="px-3 py-2">{link.platform}</td>
                        <td className="px-3 py-2">{link.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-gray-800">Gallery Photos</h4>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/app/website-settings/home/add-photo')} variant="secondary">Add Photo</Button>
                  <Button onClick={() => navigate('/app/website-settings/home/list-photo')} variant="secondary">Manage</Button>
                </div>
              </div>
              <div className="rounded border overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2">Caption</th>
                      <th className="text-left px-3 py-2">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(websiteSettings.homePageContent?.gallery || []).length === 0 && (
                      <tr><td className="px-3 py-3 text-gray-500" colSpan={2}>No gallery photos yet.</td></tr>
                    )}
                    {(websiteSettings.homePageContent?.gallery || []).map(photo => (
                      <tr key={photo.id} className="border-t">
                        <td className="px-3 py-2">{photo.caption || '-'}</td>
                        <td className="px-3 py-2">{photo.url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold text-gray-800">Contact Messages</h4>
              <Button onClick={() => navigate('/app/website-settings/contact-list')} variant="secondary">View All</Button>
            </div>
            <div className="rounded border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Received At</th>
                    <th className="text-left px-3 py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {(websiteSettings.contactMessages || []).length === 0 && (
                    <tr><td className="px-3 py-3 text-gray-500" colSpan={4}>No messages yet.</td></tr>
                  )}
                  {(websiteSettings.contactMessages || []).slice(0, 10).map(msg => (
                    <tr key={msg.id} className="border-t">
                      <td className="px-3 py-2">{msg.name}</td>
                      <td className="px-3 py-2">{msg.email}</td>
                      <td className="px-3 py-2">{new Date(msg.receivedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{msg.message.length > 80 ? `${msg.message.slice(0, 80)}…` : msg.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
};

export default AccessDataPage;
