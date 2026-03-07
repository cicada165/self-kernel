/**
 * Export/Import Routes
 */

import { Router } from 'express';
import * as exportImport from '../services/exportImport.js';

const router = Router();

/**
 * GET /api/export/all - Export all data as JSON
 */
router.get('/all', async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const download = req.query.download === 'true';

        if (format === 'json') {
            const data = await exportImport.exportAllAsJSON();

            if (download) {
                const filename = exportImport.generateExportFilename('all', 'json');
                const fileInfo = await exportImport.saveExportToFile(
                    filename,
                    JSON.stringify(data, null, 2)
                );
                res.json({ success: true, file: fileInfo });
            } else {
                res.json(data);
            }
        } else {
            res.status(400).json({ error: 'CSV format not supported for full export. Use collection-specific export.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/export/collection/:collection - Export specific collection
 */
router.get('/collection/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const format = req.query.format || 'json';
        const download = req.query.download === 'true';

        if (format === 'json') {
            const data = await exportImport.exportCollectionAsJSON(collection);

            if (download) {
                const filename = exportImport.generateExportFilename(collection, 'json');
                const fileInfo = await exportImport.saveExportToFile(
                    filename,
                    JSON.stringify(data, null, 2)
                );
                res.json({ success: true, file: fileInfo });
            } else {
                res.json(data);
            }
        } else if (format === 'csv') {
            const csvContent = await exportImport.exportCollectionAsCSV(collection);

            if (download) {
                const filename = exportImport.generateExportFilename(collection, 'csv');
                const fileInfo = await exportImport.saveExportToFile(filename, csvContent);
                res.json({ success: true, file: fileInfo });
            } else {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${collection}.csv"`);
                res.send(csvContent);
            }
        } else {
            res.status(400).json({ error: 'Invalid format. Use json or csv.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/export/import - Import data from JSON
 * Body: { data: Object, options: { merge: boolean, collections: Array } }
 */
router.post('/import', async (req, res) => {
    try {
        const { data, options } = req.body;

        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }

        const report = await exportImport.importFromJSON(data, options);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/export/import/collection/:collection - Import collection from CSV
 * Body: { csvContent: string, options: { merge: boolean } }
 */
router.post('/import/collection/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { csvContent, options } = req.body;

        if (!csvContent) {
            return res.status(400).json({ error: 'No CSV content provided' });
        }

        const report = await exportImport.importCollectionFromCSV(collection, csvContent, options);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/export/files - List available export files
 */
router.get('/files', async (req, res) => {
    try {
        const files = await exportImport.listExports();
        res.json({ files, count: files.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/export/files/:filename - Download export file
 */
router.get('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const content = await exportImport.readExportFile(filename);

        const contentType = filename.endsWith('.json') ? 'application/json' : 'text/csv';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    } catch (err) {
        res.status(404).json({ error: 'File not found' });
    }
});

/**
 * DELETE /api/export/files/:filename - Delete export file
 */
router.delete('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        await exportImport.deleteExport(filename);
        res.json({ success: true, message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
