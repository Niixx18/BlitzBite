import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return thunkAPI.rejectWithValue(data?.message || 'Failed to fetch cart');
    }
    const data = await res.json();
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ itemId, quantity = 1 }, thunkAPI) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId, quantity })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return thunkAPI.rejectWithValue(data?.message || 'Failed to add to cart');
    }
    const data = await res.json();
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ itemId, quantity }, thunkAPI) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return thunkAPI.rejectWithValue(data?.message || 'Failed to update cart item');
    }
    const data = await res.json();
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const removeCartItem = createAsyncThunk('cart/removeCartItem', async (itemId, thunkAPI) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return thunkAPI.rejectWithValue(data?.message || 'Failed to remove cart item');
    }
    const data = await res.json();
    return data.cart;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {
    clearCartState(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(addToCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(removeCartItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase('auth/logout', (state) => {
        state.items = [];
        state.status = 'idle';
        state.error = null;
      });
  }
});

export const { clearCartState } = cartSlice.actions;
export const selectCartItems = (state) => state.cart.items;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
export default cartSlice.reducer;
