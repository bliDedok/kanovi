"use client";

import React from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

interface CartPanelProps {
  items: CartItem[];
  totalPrice: number;
}

export function CartPanel({ items, totalPrice }: CartPanelProps) {
  const handleCheckout = (method: "CASH" | "QRIS") => {
    alert(`Memproses pembayaran ${method} senilai Rp ${totalPrice.toLocaleString()}`);
  };

  return (
    <div
      style={{
        width: "380px",
        backgroundColor: "#1e1611",
        color: "#f3ece7",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        borderLeft: "1px solid #3d2b1f",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "24px",
          color: "#d4a373",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>🛒</span> Keranjang Pesanan
      </h2>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: "20px" }}>
        {items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              marginTop: "60px",
              opacity: 0.5,
              padding: "20px",
              border: "1px dashed #3d2b1f",
              borderRadius: "12px",
            }}
          >
            <p>Belum ada kopi yang dipilih</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                padding: "16px",
                backgroundColor: "rgba(212, 163, 115, 0.1)",
                borderRadius: "12px",
                border: "1px solid rgba(212, 163, 115, 0.2)",
              }}
            >
              <div>
                <div style={{ fontWeight: "600", color: "#f3ece7" }}>{item.name}</div>
                <div style={{ fontSize: "0.85rem", color: "#a68a78" }}>
                  {item.quantity}x @ Rp {item.price.toLocaleString()}
                </div>
              </div>
              <div style={{ fontWeight: "bold", color: "#d4a373" }}>
                Rp {(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          paddingTop: "20px",
          borderTop: "1px solid #3d2b1f",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.25rem",
            fontWeight: "bold",
            marginBottom: "24px",
          }}
        >
          <span style={{ color: "#a68a78" }}>Total Tagihan</span>
          <span style={{ color: "#d4a373" }}>Rp {totalPrice.toLocaleString()}</span>
        </div>

        <div style={{ display: "grid", gap: "12px" }}>
          <button
            onClick={() => handleCheckout("CASH")}
            disabled={items.length === 0}
            style={{
              padding: "16px",
              backgroundColor: items.length === 0 ? "#3d2b1f" : "#d4a373",
              color: "#1e1611",
              border: "none",
              borderRadius: "12px",
              fontWeight: "800",
              cursor: items.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            BAYAR TUNAI
          </button>

          <button
            onClick={() => handleCheckout("QRIS")}
            disabled={items.length === 0}
            style={{
              padding: "16px",
              backgroundColor: "transparent",
              color: "#d4a373",
              border: "2px solid #d4a373",
              borderRadius: "12px",
              fontWeight: "800",
              cursor: items.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            QRIS MANUAL
          </button>
        </div>
      </div>
    </div>
  );
}