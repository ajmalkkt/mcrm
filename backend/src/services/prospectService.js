// src/services/prospectService.js
import db from '../config/database.js';
import { PROSPECT_QUERIES } from '../constants/prospectQueries.js';

export const createProspect = async (data) => {
  const values = [
    data.prospect_name,
    data.contact_number,
    data.email,
    data.address || null,
    data.city || null,
    data.state || null,
    data.country || null,
    data.geo_location || null,
    data.preferred_product_id || null,
    data.preferred_plan_id || null,
    data.status || 'NEW'
  ];

  const { rows } = await db.query(PROSPECT_QUERIES.CREATE_PROSPECT, values);
  return rows[0];
};

export const getProspects = async ({ status, search } = {}) => {
  const searchPattern = search ? `%${search}%` : null;
  const { rows } = await db.query(PROSPECT_QUERIES.GET_ALL_PROSPECTS, [
    status || null,
    searchPattern
  ]);
  return rows;
};

export const getProspectById = async (prospectId) => {
  const { rows } = await db.query(PROSPECT_QUERIES.GET_PROSPECT_BY_ID, [prospectId]);
  return rows[0] || null;
};

export const updateProspect = async (prospectId, data) => {
  const values = [
    prospectId,
    data.prospect_name || null,
    data.contact_number || null,
    data.email || null,
    data.address || null,
    data.city || null,
    data.state || null,
    data.country || null,
    data.geo_location || null,
    data.preferred_product_id || null,
    data.preferred_plan_id || null,
    data.status || null
  ];

  const { rows } = await db.query(PROSPECT_QUERIES.UPDATE_PROSPECT, values);
  return rows[0] || null;
};

export const deleteProspect = async (prospectId) => {
  const { rows } = await db.query(PROSPECT_QUERIES.DELETE_PROSPECT, [prospectId]);
  return rows[0] || null;
};