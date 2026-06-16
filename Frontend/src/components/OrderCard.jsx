import { Link } from 'react-router-dom';

export default function OrderCard({ order, showCustomer = false }) {
  const createdAt = new Date(order.createdAt).toLocaleString();
  
  const statusColorClass = {
    placed: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
    accepted: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
    preparing: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
    'out-for-delivery': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700',
    delivered: 'bg-green-500/10 border-green-500/30 text-green-700',
    cancelled: 'bg-rose-500/10 border-rose-500/30 text-rose-700'
  }[order.orderStatus] || 'bg-gray-500/10 border-gray-500/30 text-gray-700';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-5">
      {/* Header Info */}
      <div className="flex justify-between items-start gap-4 flex-wrap pb-3 border-b border-outline-variant/20">
        <div>
          <h3 className="font-extrabold text-base text-on-surface leading-tight">
            Order #{order._id.slice(-6).toUpperCase()}
          </h3>
          <p className="text-xs font-semibold text-on-surface-variant/50 mt-1">
            {createdAt}
          </p>
        </div>
        <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border select-none ${statusColorClass}`}>
          {order.orderStatus.replace(/-/g, ' ')}
        </div>
      </div>

      {/* Customer Info (For Rider Dashboard / Restaurant Owner) */}
      {showCustomer && order.user && (
        <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-3.5 space-y-1">
          <p className="text-xs text-on-surface">
            <strong className="text-on-surface-variant/70 uppercase tracking-wide text-[10px]">Customer:</strong> {order.user.firstName} {order.user.lastName}
          </p>
          <p className="text-xs text-on-surface">
            <strong className="text-on-surface-variant/70 uppercase tracking-wide text-[10px]">Email:</strong> {order.user.email}
          </p>
        </div>
      )}

      {/* Delivery Partner Details */}
      {order.deliveryPartner && (
        <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-3.5 space-y-1">
          <p className="text-xs text-on-surface">
            <strong className="text-on-surface-variant/70 uppercase tracking-wide text-[10px]">Rider Assigned:</strong> {order.deliveryPartner.firstName} {order.deliveryPartner.lastName}
          </p>
          {order.deliveryPartner.phone && (
            <p className="text-xs text-on-surface">
              <strong className="text-on-surface-variant/70 uppercase tracking-wide text-[10px]">Phone:</strong> {order.deliveryPartner.phone}
            </p>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2.5">
        {order.items.map((item) => (
          <div
            key={`${order._id}-${item.item}-${item.name}`}
            className="flex justify-between items-center gap-4 p-3.5 bg-surface border border-outline-variant/35 rounded-xl text-xs"
          >
            <div className="min-w-0">
              <p className="font-extrabold text-on-surface leading-tight truncate">
                {item.name}
              </p>
              <p className="text-[10px] font-bold text-on-surface-variant/60 mt-1">
                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
              </p>
              {item.shop && item.shop.name && (
                <p className="text-[9px] font-semibold text-primary mt-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">storefront</span>
                  {item.shop.name}
                </p>
              )}
            </div>
            <span className="font-black text-on-surface shrink-0">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Address & Payment Info Card */}
      <div className="bg-surface border border-outline-variant/25 rounded-2xl p-4 space-y-2.5 text-xs">
        <div className="leading-relaxed">
          <strong className="text-on-surface-variant/80">Address: </strong>
          <span className="text-on-surface font-medium block mt-1 whitespace-pre-line">
            {order.deliveryAddress?.fullName ? (
              <>
                <span className="font-extrabold">{order.deliveryAddress.fullName} ({order.deliveryAddress.phoneNumber})</span>
                <br />
                {order.deliveryAddress.flatNo}, {order.deliveryAddress.street}
                {order.deliveryAddress.landmark ? `, Landmark: ${order.deliveryAddress.landmark}` : ''}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode || order.deliveryAddress.zipCode}
                {order.deliveryAddress.deliveryInstructions && (
                  <>
                    <br />
                    <span className="italic text-on-surface-variant/75 text-[11px] block mt-1 bg-surface-container/60 p-2 rounded-lg">
                      Instruction: {order.deliveryAddress.deliveryInstructions}
                    </span>
                  </>
                )}
              </>
            ) : (
              `${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} ${order.deliveryAddress?.zipCode || ''}`
            )}
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
          <span>Payment: {order.paymentMethod.toUpperCase()}</span>
          {order.notes && <span className="normal-case font-normal text-on-surface-variant/80 truncate max-w-[150px]">Note: {order.notes}</span>}
        </div>
        <div className="flex justify-between items-center font-black text-sm text-on-surface pt-2.5 border-t border-outline-variant/20">
          <span>Total Paid</span>
          <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="flex items-center gap-4 pt-1 text-xs">
        <Link
          to="/orders"
          className="text-on-surface-variant/65 hover:text-primary font-bold transition-colors"
        >
          View all orders
        </Link>
        {!['delivered', 'cancelled'].includes(order.orderStatus) && (
          <Link
            to={`/orders/${order._id}/track`}
            className="text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-0.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm font-bold">explore</span>
            Track Shipment
          </Link>
        )}
      </div>
    </div>
  );
}
