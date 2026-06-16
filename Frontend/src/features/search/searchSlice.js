import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * performSearch thunk
 * Calls GET /api/search with the provided query params.
 * Returns { shops, items, query }.
 */
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async ({ q = '', category = '', city = '', isOpen = '', minPrice = '', maxPrice = '', spiceLevel = '', isAvailable = '' } = {}, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (isOpen !== '') params.set('isOpen', isOpen);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (spiceLevel) params.set('spiceLevel', spiceLevel);
      if (isAvailable !== '') params.set('isAvailable', isAvailable);
      params.set('t', Date.now().toString());

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return thunkAPI.rejectWithValue(data?.message || 'Search failed');
      }
      return await res.json(); // { shops, items, query }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    shops: [],
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    setSearchQuery(state, action) {
      state.query = action.payload;
    },
    clearSearch(state) {
      state.query = '';
      state.shops = [];
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.query = action.payload.query || '';
        state.shops = action.payload.shops || [];
        state.items = action.payload.items || [];
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      });
  },
});

export const { setSearchQuery, clearSearch } = searchSlice.actions;

export const selectSearchQuery = (state) => state.search.query;
export const selectSearchShops = (state) => state.search.shops;
export const selectSearchItems = (state) => state.search.items;
export const selectSearchStatus = (state) => state.search.status;
export const selectSearchError = (state) => state.search.error;

export default searchSlice.reducer;
