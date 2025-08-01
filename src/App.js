import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [payrollPeriod, setPayrollPeriod] = useState('first');
  const [payrollData, setPayrollData] = useState(null);
  const [sectorData, setSectorData] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');

  // Clear form data when modal opens
  const openModal = (type) => {
    setModalType(type);
    setFormData({}); // Clear form data
    setShowModal(true);
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
    }
  };

  // Fetch employee details and payroll
  const fetchEmployeeDetails = async (employeeId) => {
    try {
      const response = await axios.get(`${API}/employees/${employeeId}`);
      setSelectedEmployee(response.data);
      
      // Fetch payroll data for current period
      const payrollResponse = await axios.get(`${API}/employees/${employeeId}/payroll/${payrollPeriod}`);
      setPayrollData(payrollResponse.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes do funcionário:', error);
    }
  };

  // Handle payroll period change
  const handlePeriodChange = async (period) => {
    setPayrollPeriod(period);
    if (selectedEmployee) {
      try {
        const response = await axios.get(`${API}/employees/${selectedEmployee.id}/payroll/${period}`);
        setPayrollData(response.data);
      } catch (error) {
        console.error('Erro ao calcular folha de pagamento:', error);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'register') {
        const submitData = {
          ...formData,
          gross_salary: parseFloat(formData.gross_salary) || 0
        };
        await axios.post(`${API}/employees`, submitData);
        alert('Funcionário cadastrado com sucesso!');
        fetchEmployees();
      } else if (modalType === 'salary') {
        const submitData = {
          ...formData,
          gross_salary: parseFloat(formData.gross_salary) || 0
        };
        await axios.put(`${API}/employees/${selectedEmployee.id}/salary`, submitData);
        alert('Salário atualizado com sucesso!');
        fetchEmployeeDetails(selectedEmployee.id);
      } else if (modalType === 'pix') {
        await axios.put(`${API}/employees/${selectedEmployee.id}/pix`, formData);
        alert('Chave PIX atualizada com sucesso!');
        fetchEmployeeDetails(selectedEmployee.id);
      } else if (modalType === 'fire') {
        await axios.delete(`${API}/employees/${selectedEmployee.id}`, { data: formData });
        alert('Funcionário demitido com sucesso!');
        setCurrentView('employees');
        fetchEmployees();
      } else if (modalType === 'calculations') {
        const submitData = {
          employee_id: selectedEmployee.id,
          first_half_hours: parseFloat(formData.first_half_hours) || 0,
          second_half_hours: parseFloat(formData.second_half_hours) || 0,
          first_half_advance: parseFloat(formData.first_half_advance) || 0,
          second_half_absences: parseInt(formData.second_half_absences) || 0,
          food_basket_value: parseFloat(formData.food_basket_value) || 0
        };
        await axios.put(`${API}/employees/${selectedEmployee.id}/calculations`, submitData);
        alert('Dados atualizados com sucesso!');
        fetchEmployeeDetails(selectedEmployee.id);
      } else if (modalType === 'sector-access') {
        await axios.post(`${API}/validate-password`, formData);
        setCurrentView('sectors');
      } else if (modalType === 'sector-update') {
        const submitData = {
          ...formData,
          daily_quantity: parseFloat(formData.daily_quantity) || 0
        };
        await axios.post(`${API}/sectors/${selectedSector}/update`, submitData);
        alert('Dados do setor atualizados com sucesso!');
        fetchSectorData(selectedSector);
      }
      
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro na operação');
    }
  };

  // Fetch sector data
  const fetchSectorData = async (sectorName) => {
    try {
      const response = await axios.get(`${API}/sectors/${sectorName}/data`);
      setSectorData(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados do setor:', error);
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal component
  const Modal = () => (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          {modalType === 'register' && 'Registrar Funcionário'}
          {modalType === 'salary' && 'Alterar Salário'}
          {modalType === 'pix' && 'Alterar Chave PIX'}
          {modalType === 'fire' && 'Demitir Funcionário'}
          {modalType === 'calculations' && 'Atualizar Dados'}
          {modalType === 'sector-access' && 'Acesso aos Salões'}
          {modalType === 'sector-update' && 'Atualizar Quantidade Diária'}
        </h2>
        
        <form onSubmit={handleSubmit} autoComplete="off">
          {modalType === 'register' && (
            <>
              <div className="input-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Digite o nome completo do funcionário"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>
              <div className="input-group">
                <label>Salário Bruto *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Digite o salário em reais (ex: 3000.00)"
                  value={formData.gross_salary || ''}
                  onChange={(e) => setFormData({...formData, gross_salary: e.target.value})}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="input-group">
                <label>Chave PIX (opcional)</label>
                <input
                  type="text"
                  placeholder="Digite a chave PIX (email, telefone ou CPF)"
                  value={formData.pix_key || ''}
                  onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label>Senha para Cadastro *</label>
                <input
                  type="password"
                  placeholder="Digite a senha de autorização"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}
          
          {modalType === 'salary' && (
            <>
              <div className="input-group">
                <label>Novo Salário Bruto *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Digite o novo salário"
                  value={formData.gross_salary || ''}
                  onChange={(e) => setFormData({...formData, gross_salary: e.target.value})}
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>
              <div className="input-group">
                <label>Senha do Chefe *</label>
                <input
                  type="password"
                  placeholder="Digite a senha de autorização"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}
          
          {modalType === 'pix' && (
            <>
              <div className="input-group">
                <label>Nova Chave PIX *</label>
                <input
                  type="text"
                  placeholder="Digite a nova chave PIX"
                  value={formData.pix_key || ''}
                  onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                  autoComplete="off"
                  autoFocus
                  required
                />
              </div>
              <div className="input-group">
                <label>Senha do Chefe *</label>
                <input
                  type="password"
                  placeholder="Digite a senha de autorização"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}
          
          {modalType === 'fire' && (
            <>
              <div className="confirmation-message">
                <p>⚠️ Tem certeza que deseja demitir <strong>{selectedEmployee?.full_name}</strong>?</p>
                <p className="warning-text">Esta ação não pode ser desfeita.</p>
              </div>
              <div className="input-group">
                <label>Senha do Chefe *</label>
                <input
                  type="password"
                  placeholder="Digite a senha de autorização"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  autoComplete="new-password"
                  autoFocus
                  required
                />
              </div>
            </>
          )}
          
          {modalType === 'calculations' && (
            <>
              <div className="input-group">
                <label>Horas 1ª Quinzena</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Digite as horas trabalhadas"
                  value={formData.first_half_hours || ''}
                  onChange={(e) => setFormData({...formData, first_half_hours: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label>Horas 2ª Quinzena</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Digite as horas trabalhadas"
                  value={formData.second_half_hours || ''}
                  onChange={(e) => setFormData({...formData, second_half_hours: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label>Vale 1ª Quinzena</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Digite o valor do vale"
                  value={formData.first_half_advance || ''}
                  onChange={(e) => setFormData({...formData, first_half_advance: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label>Número de Faltas (2ª Quinzena)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Digite o número de faltas"
                  value={formData.second_half_absences || ''}
                  onChange={(e) => setFormData({...formData, second_half_absences: e.target.value})}
                  autoComplete="off"
                />
              </div>
              <div className="input-group">
                <label>Valor Cesta Básica</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Digite o valor da cesta básica"
                  value={formData.food_basket_value || ''}
                  onChange={(e) => setFormData({...formData, food_basket_value: e.target.value})}
                  autoComplete="off"
                />
              </div>
            </>
          )}
          
          {(modalType === 'sector-access' || modalType === 'sector-update') && (
            <>
              <div className="input-group">
                <label>Senha de Acesso *</label>
                <input
                  type="password"
                  placeholder="Digite a senha de autorização"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  autoComplete="new-password"
                  autoFocus
                  required
                />
              </div>
              {modalType === 'sector-update' && (
                <>
                  <div className="input-group">
                    <label>Quantidade Diária *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Digite a quantidade do dia"
                      value={formData.daily_quantity || ''}
                      onChange={(e) => setFormData({...formData, daily_quantity: e.target.value})}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Data *</label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          <div className="modal-buttons">
            <button type="submit" className="btn btn-primary">
              {modalType === 'fire' ? 'Confirmar Demissão' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Home View
  if (currentView === 'home') {
    return (
      <div className="app">
        <div className="home-container">
          <h1 className="app-title">Sistema de Gestão</h1>
          <div className="home-buttons">
            <button 
              className="home-btn employees-btn"
              onClick={() => {
                setCurrentView('employees');
                fetchEmployees();
              }}
            >
              <span className="btn-icon">👥</span>
              Funcionários
            </button>
            <button 
              className="home-btn salons-btn"
              onClick={() => {
                setModalType('sector-access');
                setShowModal(true);
              }}
            >
              <span className="btn-icon">🏢</span>
              Salões
            </button>
          </div>
        </div>
        {showModal && <Modal />}
      </div>
    );
  }

  // Employees List View
  if (currentView === 'employees') {
    return (
      <div className="app">
        <div className="employees-container">
          <div className="header">
            <button className="back-btn" onClick={() => setCurrentView('home')}>← Voltar</button>
            <h1>Funcionários</h1>
          </div>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              className="btn btn-primary"
              onClick={() => openModal('register')}
            >
              Registrar Funcionário
            </button>
          </div>
          
          <div className="employees-list">
            {filteredEmployees.map(employee => (
              <div 
                key={employee.id} 
                className="employee-card"
                onClick={() => {
                  setSelectedEmployee(employee);
                  setCurrentView('employee-details');
                  fetchEmployeeDetails(employee.id);
                }}
              >
                <div className="employee-photo">
                  {employee.photo ? (
                    <img src={`data:image/jpeg;base64,${employee.photo}`} alt={employee.full_name} />
                  ) : (
                    <div className="photo-placeholder">👤</div>
                  )}
                </div>
                <div className="employee-info">
                  <h3>{employee.full_name}</h3>
                  <p>Salário: R$ {employee.gross_salary?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {showModal && <Modal />}
      </div>
    );
  }

  // Employee Details View
  if (currentView === 'employee-details' && selectedEmployee) {
    return (
      <div className="app">
        <div className="employee-details-container">
          <div className="header">
            <button className="back-btn" onClick={() => setCurrentView('employees')}>← Voltar</button>
            <h1>Detalhes do Funcionário</h1>
          </div>
          
          <div className="employee-profile">
            <div className="profile-photo">
              {selectedEmployee.photo ? (
                <img src={`data:image/jpeg;base64,${selectedEmployee.photo}`} alt={selectedEmployee.full_name} />
              ) : (
                <div className="photo-placeholder-large">👤</div>
              )}
            </div>
            <h2>{selectedEmployee.full_name}</h2>
            <p className="pix-key">PIX: {selectedEmployee.pix_key || 'Não informado'}</p>
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => openModal('pix')}
            >
              Alterar PIX
            </button>
          </div>
          
          <div className="payroll-panel">
            <div className="period-toggles">
              <button 
                className={`period-btn ${payrollPeriod === 'first' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('first')}
              >
                1ª Quinzena
              </button>
              <button 
                className={`period-btn ${payrollPeriod === 'second' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('second')}
              >
                2ª Quinzena
              </button>
            </div>
            
            {payrollData && (
              <div className="payroll-info">
                <h3>{payrollData.period}</h3>
                <div className="payroll-details">
                  <p><strong>Salário Bruto:</strong> R$ {payrollData.gross_salary.toFixed(2)}</p>
                  <p><strong>Horas Trabalhadas:</strong> {payrollData.hours_worked}</p>
                  <p><strong>Valor do Vale:</strong> R$ {payrollData.advance_value.toFixed(2)}</p>
                  <p><strong>Número de Faltas:</strong> {payrollData.absences}</p>
                  <p><strong>Valor de Desconto:</strong> R$ {payrollData.discount_value.toFixed(2)}</p>
                  <p className="total-pay"><strong>Total a Pagar:</strong> R$ {payrollData.total_to_pay.toFixed(2)}</p>
                </div>
              </div>
            )}
            
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setModalType('calculations');
                setShowModal(true);
              }}
            >
              Atualizar Dados
            </button>
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn btn-danger"
              onClick={() => {
                setModalType('fire');
                setShowModal(true);
              }}
            >
              Demitir
            </button>
            <button 
              className="btn btn-success"
              onClick={() => {
                setModalType('salary');
                setShowModal(true);
              }}
            >
              Salário
            </button>
          </div>
        </div>
        {showModal && <Modal />}
      </div>
    );
  }

  // Sectors View
  if (currentView === 'sectors') {
    return (
      <div className="app">
        <div className="sectors-container">
          <div className="header">
            <button className="back-btn" onClick={() => setCurrentView('home')}>← Voltar</button>
            <h1>Salões</h1>
          </div>
          
          <div className="sectors-grid">
            <button 
              className="sector-btn"
              onClick={() => {
                setSelectedSector('Setor 1');
                setCurrentView('sector-details');
                fetchSectorData('Setor 1');
              }}
            >
              <span className="sector-icon">🏢</span>
              Setor 1
            </button>
            <button 
              className="sector-btn"
              onClick={() => {
                setSelectedSector('Setor 2');
                setCurrentView('sector-details');
                fetchSectorData('Setor 2');
              }}
            >
              <span className="sector-icon">🏢</span>
              Setor 2
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sector Details View
  if (currentView === 'sector-details' && selectedSector) {
    return (
      <div className="app">
        <div className="sector-details-container">
          <div className="header">
            <button className="back-btn" onClick={() => setCurrentView('sectors')}>← Voltar</button>
            <h1>{selectedSector}</h1>
          </div>
          
          <div className="sector-update-section">
            <button 
              className="btn btn-primary"
              onClick={() => {
                setModalType('sector-update');
                setShowModal(true);
              }}
            >
              Atualizar Quantidade Diária
            </button>
          </div>
          
          <div className="sector-data">
            <h3>Dados Recentes</h3>
            {sectorData.slice(0, 10).map((data, index) => (
              <div key={index} className="data-row">
                <span>{data.date}</span>
                <span>{data.daily_quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="graph-placeholder">
            <p>📊 Gráfico de desempenho em desenvolvimento</p>
            <p>Dados: {sectorData.length} registros</p>
          </div>
        </div>
        {showModal && <Modal />}
      </div>
    );
  }

  return <div>Carregando...</div>;
};

export default App;