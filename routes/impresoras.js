const express = require('express');
const router = express.Router();
const { Client } = require('pg');
const db = require('./database');

router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
  console.log('Conexión exitosa a la base de datos');
  const client = new Client(db);
  try {
    await client.connect();
    const impresorasResult = await client.query(`SELECT * FROM impresoras ORDER BY id`);
    const impresoras = impresorasResult.rows;

    for (let impresora of impresoras) {
      const impresionesResult = await client.query(`SELECT * FROM impresion WHERE idImpresora = $1`, [impresora.id]);
      impresora.impresiones = impresionesResult.rows;
    }

    res.render('index', { impresoras });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.end();
  }
});

router.get('/:id', async (req, res) => {
  const client = new Client(db);
  try {
    await client.connect();
    const idImpresora = req.params.id;
    const impresoraResult = await client.query('SELECT * FROM impresoras WHERE id = $1', [idImpresora]);
    const impresora = impresoraResult.rows[0];
    if (!impresora) {
      return res.status(404).json({ message: 'Impresora no encontrada' });
    }
    res.json(impresora);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.end();
  }
});

router.get('/impresion', async (req, res) => {
  const client = new Client(db);
  try {
    await client.connect();
    const impresionesResult = await client.query('SELECT * FROM impresion');
    const impresiones = impresionesResult.rows;
    res.json(impresiones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.end();
  }
});

router.post('/impresion', async (req, res) => {
  const client = new Client(db);
  try {
    await client.connect();

    const { texto, idImpresora } = req.body;

    await client.query('INSERT INTO impresion (texto, idImpresora) VALUES ($1, $2)', [texto, idImpresora]);

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.end();
  }
});

router.delete('/impresion/:id', async (req, res) => {
  const client = new Client(db);
  try {
    const idImpresora = req.params.id;
    console.log('impresora: ' + idImpresora);
    //hay algo que esta mal
    // const impresionesCountResult = await client.query('SELECT COUNT(*) FROM impresion WHERE idImpresora = $1', [idImpresora]);
    // console.log('impresionesCountResult: ' + impresionesCountResult);
    // const impresionesCount = parseInt(impresionesCountResult.rows[0].count);
    // console.log('impresionesCount: ' + impresionesCount);
    const porcentajeReduccionNegro = 8;
    const porcentajeReduccionColores = 5;

    await client.connect();

    await client.query('DELETE FROM impresion WHERE idImpresora = $1', [idImpresora]);

    await client.query(
      `UPDATE impresoras
       SET tintanegra = GREATEST(tintanegra - $1, 0),
           tintaamarilla = GREATEST(tintaamarilla - $2, 0),
           tintacian = GREATEST(tintacian - $2, 0),
           tintarosa = GREATEST(tintarosa - $2, 0)
       WHERE id = $3`,
      [porcentajeReduccionNegro, porcentajeReduccionColores, idImpresora]
    );

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.end();
  }
});

module.exports = router;
