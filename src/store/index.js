import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentDataset: null
  },
  mutations: {
    SET_CURRENT_DATASET(state, dataset) {
      state.currentDataset = dataset
    }
  },
  actions: {
    setCurrentDataset({ commit }, dataset) {
      commit('SET_CURRENT_DATASET', dataset)
    }
  },
  getters: {
    getCurrentDataset: state => state.currentDataset
  }
}) 