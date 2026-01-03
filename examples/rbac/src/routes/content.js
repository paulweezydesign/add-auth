const express = require('express');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Demo protected endpoint that requires a permission
router.put('/:id', requirePermission('content:update'), async (req, res) => {
  res.json({
    success: true,
    message: `Updated content ${req.params.id}`,
    data: { id: req.params.id, payload: req.body }
  });
});

module.exports = router;

