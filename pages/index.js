import React, { useState, useEffect } from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import {Line} from 'react-chartjs-2';
import stats from 'stats-lite';

const metrics = [
  'FCP',
  'SI',
  'TTI',
  'LCP',
  'CLS',
  'TBT',
  'SCORE'
];

const buildData = (rawData) => {
  if (rawData.length === 0) return {}
  const result = {};
  metrics.forEach(metric => {
    result[metric] = {
      labels: rawData.map(dataPoint => dataPoint.time),
      datasets: [{
        label: metric,
        fill: false,
        lineTension: 0.1,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: 'rgba(75,192,192,1)',
        pointBackgroundColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgba(75,192,192,1)',
        pointHoverBorderColor: 'rgba(220,220,220,1)',
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: rawData.map(dataPoint => dataPoint.metrics[metric])
      }]
    }
  })
  return result;
}

const PerformanceMonitor  = () => {
  const [ startMonitoring, setStartMonitoring ] = useState(false);
  const [ monitoringUrl, setMonitoringUrl ] = useState();
  const [ rawData, setRawData ] = useState([]);

  useEffect(() => {
    const run = async () => {
      const url = new URL('/api/run', window.location.href);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: monitoringUrl
        })
      });
      if (response.ok) {
        const metrics = await response.json();
        setRawData([
          ...rawData,
          {
            time: Date.now(),
            metrics
          }
        ]);
      }
    }
    if (startMonitoring) {
      run();
      const interval = setInterval(run, 30000);
      return () => clearInterval(interval);
    }
  }, [startMonitoring, rawData])

  const handleUrlChange = (event) => {
    event.preventDefault();
    setMonitoringUrl(event.target.value);
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setStartMonitoring(true)
  }

  const data = buildData(rawData)
  return (
    <Container>
      <Form inline className='mt-5 mb-5 justify-content-center'  onSubmit={handleSubmit}>
        <Form.Label srOnly>URL to monitor</Form.Label>
        <Form.Control style={{flex: 0.75}} type='text' name='url' placeholder='https://www.avvo.com' onChange={handleUrlChange}/>
        <Button className='ml-3' variant='primary' type='submit' >
          Go!
        </Button>
      </Form>
      <Row>
        {
          metrics.map(metric => (
            <Col key={metric} xs={4} style={{height: '22vh'}} className='mb-5 mt-3'>
              <Line
                data={data[metric] || {}}
                options={{ maintainAspectRatio: false }}
              />
              <div className="text-center">
                <small>
                  <span><strong>Mean: </strong>{stats.mean(data[metric] ? data[metric].datasets[0].data : [0]).toFixed(5)}{', '}</span>
                  <span><strong>Median: </strong>{stats.median(data[metric] ? data[metric].datasets[0].data : [0]).toFixed(5)}{', '}</span>
                  <span><strong>Std. Deviation: </strong>{stats.stdev(data[metric] ? data[metric].datasets[0].data : [0]).toFixed(5)}</span>
                </small>
              </div>
            </Col>
          ))
        }
      </Row>
    </Container>
  )
}

export default PerformanceMonitor;
